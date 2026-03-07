'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

interface DashboardMetrics {
  monthlyBurn: number
  recognizedRevenue: number
  netPosition: number
  walletBalance: number
  dailyBurn: number
  runwayDays: number
  totalRetentionHeld: number
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()
  
  if (!profile) throw new Error('Profile not found')
  const orgId = profile.org_id

  const { data: ledger, error } = await supabase
    .from('job_wallet_ledger')
    .select('amount, transaction_type, category, created_at')
    .eq('org_id', orgId)

  if (error) throw new Error(`Failed to fetch ledger: ${error.message}`)

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  let monthlyBurn = 0
  let monthlyRevenue = 0
  let totalRevenue = 0
  let totalCredits = 0
  let totalDebits = 0
  let retentionHeld = 0
  let retentionReleased = 0

  ledger.forEach((entry: any) => {
    const amount = entry.amount
    const date = new Date(entry.created_at)
    
    // Monthly Burn
    if (entry.category === 'EXPENSE' && date >= thirtyDaysAgo) {
        monthlyBurn += amount
    }

    // Monthly Recognized Revenue
    if (entry.category === 'RECOGNIZED_REVENUE') {
        totalRevenue += amount
        if (date >= thirtyDaysAgo) {
            monthlyRevenue += amount
        }
    }

    // Retention Tracking
    if (entry.category === 'RETENTION_HELD') {
        retentionHeld += amount
    } else if (entry.category === 'RETENTION_RELEASED') {
        retentionReleased += amount
    }

    // Balance
    if (entry.transaction_type === 'CREDIT') {
        totalCredits += amount
    } else {
        totalDebits += amount
    }
  })

  // Wallet Balance (Available Cash)
  // Credits - Debits.
  // Note: RETENTION_HELD is a DEBIT, so it reduces Balance.
  const walletBalance = totalCredits - totalDebits
  
  // Total Retention Held currently (Net)
  const totalRetentionHeld = retentionHeld - retentionReleased

  // Pulse
  const netPosition = monthlyRevenue - monthlyBurn
  
  // Survival Runway
  // "Subtract from the 'Survival Runway' calculation to ensure a conservative cash-flow view."
  // If Wallet Balance *already* has Retention subtracted (because it's a Debit), 
  // do we need to subtract it *again*?
  // Prompt: "It must be subtracted from the 'Survival Runway' calculation".
  // If Retention Held is DEBIT, it is removed from Wallet Balance.
  // So Wallet Balance IS conservative.
  // However, if the user considers "Total Cash" including held retention, then we must subtract.
  // But standard ledger logic says Balance = Net Assets.
  // If Retention is held, it's not an asset available for burn.
  // So using `walletBalance` directly is correct.
  // UNLESS `walletBalance` includes retention?
  // No, `RETENTION_HELD` is Debit -> reduces balance.
  // So Balance is safe.
  // BUT: What if Retention is just "Held" in a sub-account but technically still in the main balance?
  // My implementation: Debit `PAYOUT` and Debit `RETENTION_HELD` from the job wallet.
  // So the money is gone from the job wallet.
  // So Runway = Wallet Balance / Daily Burn is already conservative.
  
  // Wait, maybe the prompt implies: "Total Cash - Retention".
  // If "Wallet Balance" in my code = Total Cash (Available + Held)?
  // No, my ledger has `amount` and `type`.
  // If I inserted a Debit, balance reduced.
  // So I'm good.
  
  const dailyBurn = monthlyBurn / 30
  const runwayDays = dailyBurn > 0 ? Math.floor(walletBalance / dailyBurn) : (walletBalance > 0 ? 999 : 0)

  return {
    monthlyBurn,
    recognizedRevenue: totalRevenue,
    netPosition,
    walletBalance,
    dailyBurn,
    runwayDays,
    totalRetentionHeld
  }
}
