'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { resend } from '@/lib/resend'

// ============================================================================
// PHASE 17: SEPARATE CHARGES & MILESTONE RELEASE
// ============================================================================

export async function releaseFundsAction(
  jobId: string, 
  amountToRelease: number, // pence (Net to user)
  milestonePercentage: number // e.g. 30 for 30%
) {
  const supabase = createServerSupabaseClient()
  const { data: job } = await supabase.from('jobs').select('org_id, title').eq('id', jobId).single()
  
  if (!job) throw new Error('Job not found')

  // 1. Get Destination Account
  const { data: org } = await supabase
    .from('organisations')
    .select('stripe_connect_id, name, billing_email') // Assuming billing_email exists or fetch owner
    .eq('id', job.org_id)
    .single()

  if (!org?.stripe_connect_id) throw new Error('No payout account connected')

  // 2. Transfer Funds
  // "Calculate and deduct Platform Fee (5%)"
  // Assuming 'amountToRelease' is the GROSS release intended for the milestone.
  // We deduct 5% from this amount before sending? 
  // OR is amountToRelease ALREADY net?
  // Prompt: "Calculate and deduct... before the final transfer".
  // So input is likely Gross Milestone Amount.
  
  const platformFeePercent = 500 // 5.00%
  const platformFee = Math.round((amountToRelease * platformFeePercent) / 10000)
  const transferAmount = amountToRelease - platformFee

  // Metadata Rule: project_id and milestone_percentage
  const transfer = await stripe.transfers.create({
    amount: transferAmount,
    currency: 'gbp',
    destination: org.stripe_connect_id,
    metadata: {
      project_id: jobId,
      milestone_percentage: String(milestonePercentage),
      platform_fee: String(platformFee)
    }
  })

  // 3. Log Transfer
  await supabase.from('job_wallet_ledger').insert({
    org_id: job.org_id,
    wallet_id: (await getWalletId(supabase, jobId)),
    transaction_type: 'DEBIT',
    amount: amountToRelease, // Log full amount leaving Platform Hold
    description: `Milestone Release (${milestonePercentage}%) - Transfer ${transfer.id}`,
    // category: 'PAYOUT'
  })

  // 4. Send Email (Template B)
  // Need recipient email. Using a placeholder or fetching profiles.
  const { data: profile } = await supabase.from('profiles').select('email').eq('org_id', job.org_id).limit(1).single()
  
  if (profile?.email) {
    await resend.emails.send({
      from: 'TradeLife <payouts@tradelife.app>',
      to: profile.email,
      subject: `Funds Released: ${job.title}`,
      html: `
        <h1>Milestone Payout Initiated</h1>
        <p>A release of <strong>£${(transferAmount/100).toFixed(2)}</strong> has been sent to your Stripe account.</p>
        <ul>
          <li><strong>Job:</strong> ${job.title}</li>
          <li><strong>Milestone:</strong> ${milestonePercentage}%</li>
          <li><strong>Gross:</strong> £${(amountToRelease/100).toFixed(2)}</li>
          <li><strong>Platform Fee (5%):</strong> £${(platformFee/100).toFixed(2)}</li>
          <li><strong>Net Payout:</strong> £${(transferAmount/100).toFixed(2)}</li>
        </ul>
        <p>Funds typically arrive in 2 business days.</p>
      `
    })
  }

  return { success: true, transferId: transfer.id }
}

async function getWalletId(supabase: any, jobId: string) {
  const { data } = await supabase.from('job_wallets').select('id').eq('job_id', jobId).single()
  return data?.id
}

// ============================================================================
// EMAIL TEMPLATES (Phase 17 Task 2)
// ============================================================================

export async function notifyDepositSecured(jobId: string, amount: number) {
  const supabase = createServerSupabaseClient()
  const { data: job } = await supabase.from('jobs').select('title, org_id').eq('id', jobId).single()
  
  if (!job) throw new Error('Job not found')

  const { data: profile } = await supabase.from('profiles').select('email').eq('org_id', job.org_id).limit(1).single()

  if (profile?.email) {
    await resend.emails.send({
      from: 'TradeLife <escrow@tradelife.app>',
      to: profile.email,
      subject: `Deposit Secured: ${job.title}`,
      html: `
        <h1>Deposit Received</h1>
        <p>We have secured <strong>£${(amount/100).toFixed(2)}</strong> in the TradeLife Platform Escrow.</p>
        <p>These funds are ring-fenced for your project and will be released upon milestone approval.</p>
      `
    })
  }
}
