'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createStripeCheckoutAction } from '@/lib/actions/stripe'
import { revalidatePath } from 'next/cache'

export async function reportEmergencyAction(token: string, description: string) {
  // 1. Verify Token
  const { supabase } = await import('@supabase/supabase-js')
  const adminClient = supabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: invite } = await adminClient
    .from('portal_invites')
    .select('client_id, org_id')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invite) throw new Error('Invalid token')

  // 2. Create Emergency Event
  const { data: event, error: eventError } = await adminClient
    .from('emergency_callouts')
    .insert({
      org_id: invite.org_id,
      client_id: invite.client_id,
      severity: 'CRITICAL',
      status: 'OPEN',
      description: description
    })
    .select('id')
    .single()

  if (eventError) throw new Error(`Failed to report emergency: ${eventError.message}`)

  // 3. Create Urgent Task (Instant Triage)
  await adminClient.from('assistant_tasks').insert({
    org_id: invite.org_id,
    title: '🚨 SOS: Emergency Reported',
    description: `Client reported emergency: "${description}". Call immediately.`,
    priority: 'URGENT',
    status: 'PENDING',
    due_date: new Date().toISOString() // Due NOW
  })

  // 4. Generate Pre-Paid Invoice (Emergency Fee)
  const callOutFee = 15000 // £150.00 (Hardcoded MVP standard)
  
  // Generate Number
  const { count } = await adminClient
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', invite.org_id)
  
  const invoiceNumber = `SOS-${new Date().getFullYear()}-${(count || 0) + 1}`

  // 4a. Create Emergency Quote
  const { data: quote, error: quoteError } = await adminClient.from('quotes').insert({
    org_id: invite.org_id,
    client_id: invite.client_id,
    status: 'ACCEPTED',
    quote_amount_net: callOutFee,
    quote_amount_gross: callOutFee,
    quote_total_cost: 5000,
    quote_profit: 10000,
    quote_margin_percentage: 6600,
    reference: 'SOS-AUTO'
  }).select('id').single()

  if (quoteError || !quote) throw new Error('Failed to create emergency quote')

  // 4b. Create Job
  const { data: sosJob, error: jobError } = await adminClient.from('jobs').insert({
    org_id: invite.org_id,
    client_id: invite.client_id,
    source_quote_id: quote.id,
    title: 'Emergency Response',
    status: 'BOOKED',
    target_start_date: new Date().toISOString()
  }).select('id').single()

  if (jobError || !sosJob) throw new Error('Failed to create emergency job')

  // Link event to job
  await adminClient.from('emergency_callouts').update({ job_id: sosJob.id }).eq('id', event.id)

  // 4c. Create Invoice
  const { data: finalInvoice } = await adminClient.from('invoices').insert({
    org_id: invite.org_id,
    source_job_id: sosJob.id,
    invoice_number: invoiceNumber,
    invoice_type: 'DEPOSIT',
    amount_net: callOutFee,
    amount_gross: callOutFee,
    status: 'SENT',
    issue_date: new Date().toISOString(),
    due_date: new Date().toISOString()
  }).select('id').single()

  // 4d. Line Item
  const { data: jobLine } = await adminClient.from('job_line_items').insert({
    job_id: sosJob.id,
    org_id: invite.org_id,
    description: 'Emergency Call-Out Fee',
    quantity: 1,
    unit_price_net: callOutFee,
    line_total_net: callOutFee,
    status: 'PENDING'
  }).select('id').single()

  if (jobLine && finalInvoice) {
    await adminClient.from('invoice_line_items').insert({
        org_id: invite.org_id,
        invoice_id: finalInvoice.id,
        source_job_line_id: jobLine.id,
        description: 'Emergency Call-Out Fee',
        quantity: 1,
        unit_price_net: callOutFee,
        line_total_net: callOutFee
    })
  }

  // 5. Generate Payment Link
  const { stripe } = await import('@/lib/stripe')
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'gbp',
        product_data: { name: 'Emergency Call-Out Fee' },
        unit_amount: callOutFee,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/p/${token}?sos_paid=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/p/${token}?sos_cancelled=true`,
    client_reference_id: finalInvoice?.id,
    metadata: {
      invoice_id: finalInvoice?.id,
      org_id: invite.org_id,
      source_job_id: sosJob.id
    },
  })

  return { success: true, paymentUrl: session.url }
}
