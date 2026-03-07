'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { redirect } from 'next/navigation'

export async function createStripeConnectAccountLink() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
  
  if (!profile) throw new Error('Profile not found')

  const { data: org } = await supabase.from('organisations').select('stripe_connect_id').eq('id', profile.org_id).single()

  let accountId = org?.stripe_connect_id

  if (!accountId) {
    const account = await stripe.accounts.create({ type: 'express' })
    accountId = account.id
    
    await supabase
      .from('organisations')
      .update({ stripe_connect_id: accountId })
      .eq('id', profile.org_id)
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/settings/payments`,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/settings/payments`,
    type: 'account_onboarding',
  })

  return { url: accountLink.url }
}

export async function releaseFundsAction(jobId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: job } = await supabase.from('jobs').select('org_id, job_wallet_ledger(*)').eq('id', jobId).single()
  
  if (!job) throw new Error('Job not found')

  const { data: org } = await supabase.from('organisations').select('stripe_connect_id').eq('id', job.org_id).single()

  if (!org?.stripe_connect_id) throw new Error('No payout account connected')

  const totalCredits = job.job_wallet_ledger
    .filter((e: any) => e.transaction_type === 'CREDIT')
    .reduce((sum: number, e: any) => sum + e.amount, 0)

  // Avoid zero transfer
  if (totalCredits <= 0) throw new Error('No funds to release')

  const transfer = await stripe.transfers.create({
    amount: totalCredits,
    currency: 'gbp',
    destination: org.stripe_connect_id,
  })

  return { success: true, transferId: transfer.id }
}
