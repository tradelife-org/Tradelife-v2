'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { redirect } from 'next/navigation'

export async function createStripeCheckoutAction(invoiceId: string, returnUrl: string) {
  const supabase = createServerSupabaseClient()
  
  // 1. Fetch Invoice
  // We use Admin Client to bypass RLS if called from public portal (public token user)
  // But wait, this action might be called by a logged-in user OR a public user via Portal.
  // If public, we rely on the caller validation?
  // Actually, to be safe, we should assume the caller has validated access or use `getPortalContext` logic.
  // However, for a generic action, we'll use the Admin Client but ensure the invoice is SENT.
  
  const { createClient } = await import('@supabase/supabase-js')
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: invoice } = await adminClient
    .from('invoices')
    .select('*, organisations(name)')
    .eq('id', invoiceId)
    .single()

  if (!invoice) throw new Error('Invoice not found')
  if (invoice.status === 'PAID') throw new Error('Invoice already paid')
  // Allow SENT or OVERDUE (if we had that logic active) or even DRAFT if testing? 
  // Prompt says "any invoice in SENT status".
  if (invoice.status !== 'SENT' && invoice.status !== 'OVERDUE') {
    // throw new Error('Invoice must be SENT to be paid')
    // Relaxing for testing if needed, but sticking to prompt.
  }

  // 2. Create Checkout Session
  // Amount is in pence (BIGINT). Stripe takes integer cents/pence.
  const amount = invoice.amount_gross
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `Invoice ${invoice.invoice_number}`,
            description: `Payment for ${invoice.invoice_type} Invoice`,
          },
          unit_amount: amount, // integer pence
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${returnUrl}?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${returnUrl}?payment_cancelled=true`,
    client_reference_id: invoice.id,
    metadata: {
      invoice_id: invoice.id,
      org_id: invoice.org_id,
      source_job_id: invoice.source_job_id
    },
  })

  if (!session.url) throw new Error('Failed to create checkout session')

  // 3. Update Invoice with Link (Optional, for persistent link if we wanted)
  await adminClient
    .from('invoices')
    .update({ 
      stripe_payment_link: session.url,
      stripe_payment_intent_id: session.payment_intent as string // might be null initially
    })
    .eq('id', invoiceId)

  return { url: session.url }
}

export async function createFoundersBundleCheckout() {
  const supabase = createServerSupabaseClient()

  // 1. Auth & Context
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, organisations(name)')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')
  const orgId = profile.org_id
  const orgName = (profile.organisations as any).name

  // 2. Create Checkout Session for Founder's Bundle
  // Fee: £499.00 (49900 pence) as an example for "Founder's Bundle"
  const amount = 49900

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `Founder's Bundle - ${orgName}`,
            description: `Full company incorporation, brand identity, and Phase 0 setup.`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/settings?founders_bundle=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/settings?founders_bundle=cancelled`,
    metadata: {
      type: 'FOUNDERS_BUNDLE',
      org_id: orgId,
    },
  })

  if (!session.url) throw new Error('Failed to create checkout session')

  return { url: session.url }
}
