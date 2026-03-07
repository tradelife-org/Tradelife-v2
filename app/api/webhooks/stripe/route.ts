import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  // Admin Client for Webhook (Bypass RLS)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const body = await req.text()
  const signature = headers().get('Stripe-Signature') as string

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any
    const invoiceId = session.metadata?.invoice_id
    const orgId = session.metadata?.org_id
    const jobId = session.metadata?.source_job_id
    const amountPaid = session.amount_total // integer pence
    const paymentIntentId = session.payment_intent as string

    if (invoiceId && orgId) {
      console.log(`Processing payment for Invoice ${invoiceId}`)

      // 1. IDEMPOTENCY CHECK
      const { data: existingPayment } = await supabase
        .from('payment_records')
        .select('id')
        .eq('provider_ref', paymentIntentId)
        .single()

      if (existingPayment) {
        console.log(`Payment ${paymentIntentId} already processed. Skipping.`)
        return NextResponse.json({ received: true, idempotent: true })
      }

      // 2. Update Invoice Status
      const { error: invError } = await supabase
        .from('invoices')
        .update({ 
          status: 'PAID', 
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: paymentIntentId
        })
        .eq('id', invoiceId)

      if (invError) console.error('Error updating invoice:', invError)

      // 3. Create Payment Record
      const { error: payError } = await supabase
        .from('payment_records')
        .insert({
          org_id: orgId,
          invoice_id: invoiceId,
          amount: amountPaid,
          currency: session.currency,
          provider: 'stripe',
          provider_ref: paymentIntentId,
          status: 'succeeded'
        })

      if (payError) console.error('Error creating payment record:', payError)

      // 4. Ledger Write-Back
      if (jobId) {
        // Ensure Wallet Exists
        let { data: wallet } = await supabase
          .from('job_wallets')
          .select('id')
          .eq('job_id', jobId)
          .single()

        if (!wallet) {
          const { data: newWallet } = await supabase
            .from('job_wallets')
            .insert({ org_id: orgId, job_id: jobId })
            .select('id')
            .single()
          wallet = newWallet
        }

        if (wallet) {
          await supabase
            .from('job_wallet_ledger')
            .insert({
              org_id: orgId,
              wallet_id: wallet.id,
              transaction_type: 'CREDIT', // Income
              amount: amountPaid,
              description: `Payment for Invoice ${invoiceId.slice(0,8)}`
            })
        }
      }
    }
  }

  return NextResponse.json({ received: true })
}
