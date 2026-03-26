import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  // Log raw webhook
  await supabase.from('webhook_logs').insert({
    source: 'stripe',
    payload: body,
  })

  // Verify signature if webhook secret is configured
  let event
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (webhookSecret && sig) {
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } catch (err: any) {
      return new Response(`Webhook signature error: ${err.message}`, { status: 400 })
    }
  } else {
    event = JSON.parse(body)
  }

  // Only process checkout.session.completed
  if (event.type !== 'checkout.session.completed') {
    return Response.json({ received: true })
  }

  const session = event.data.object
  const invoiceId = session.metadata?.invoice_id
  const orgId = session.metadata?.org_id
  const jobId = session.metadata?.source_job_id
  const amount = session.amount_total // pence
  const paymentIntentId = session.payment_intent

  // Validate required fields
  if (!invoiceId) {
    return Response.json({ received: true, skipped: 'no invoice_id' })
  }

  // Idempotency: check if payment already recorded
  const { data: existing } = await supabase
    .from('payment_records')
    .select('id')
    .eq('provider_ref', paymentIntentId)
    .maybeSingle()

  if (existing) {
    return Response.json({ received: true, skipped: 'already processed' })
  }

  // 1. Update invoice status → PAID
  await supabase
    .from('invoices')
    .update({ status: 'PAID' })
    .eq('id', invoiceId)

  // 2. Insert payment record
  await supabase.from('payment_records').insert({
    org_id: orgId,
    invoice_id: invoiceId,
    amount,
    currency: 'gbp',
    provider: 'stripe',
    provider_ref: paymentIntentId,
    status: 'succeeded',
    payment_date: new Date().toISOString(),
  })

  // 3. Write to ledger
  if (orgId && jobId) {
    await supabase.from('job_wallet_ledger').insert({
      org_id: orgId,
      job_id: jobId,
      amount,
      transaction_type: 'CREDIT',
      category: 'RECOGNIZED_REVENUE',
      description: 'Stripe payment received',
    })

    // 4. Update job wallet balance if exists
    const { data: wallet } = await supabase
      .from('job_wallets')
      .select('id, balance')
      .eq('job_id', jobId)
      .maybeSingle()

    if (wallet) {
      await supabase
        .from('job_wallets')
        .update({ balance: wallet.balance + amount })
        .eq('id', wallet.id)
    }
  }

  return Response.json({ received: true, processed: true })
}
