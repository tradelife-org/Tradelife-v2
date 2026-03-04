'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

interface DashboardMetrics {
  monthlyBurn: number
  recognizedRevenue: number
  netPosition: number
  walletBalance: number
  dailyBurn: number
  runwayDays: number
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = createServerSupabaseClient()
  
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
  let totalRevenue = 0 // Total Recognized
  let totalCredits = 0
  let totalDebits = 0

  ledger.forEach((entry: any) => {
    const amount = entry.amount
    const date = new Date(entry.created_at)
    
    // Monthly Burn (Expense Last 30 Days)
    if (entry.category === 'EXPENSE' && date >= thirtyDaysAgo) {
        monthlyBurn += amount
    }

    // Monthly Recognized Revenue
    if (entry.category === 'RECOGNIZED_REVENUE') {
        totalRevenue += amount // Total
        if (date >= thirtyDaysAgo) {
            monthlyRevenue += amount // Monthly
        }
    }

    // Balance
    if (entry.transaction_type === 'CREDIT') {
        totalCredits += amount
    } else {
        totalDebits += amount
    }
  })

  const walletBalance = totalCredits - totalDebits
  // Pulse: Net Position (Revenue - Burn). Assuming Monthly Pulse.
  const netPosition = monthlyRevenue - monthlyBurn
  
  // Survival Runway
  const dailyBurn = monthlyBurn / 30
  const runwayDays = dailyBurn > 0 ? Math.floor(walletBalance / dailyBurn) : (walletBalance > 0 ? 999 : 0)

  return {
    monthlyBurn,
    recognizedRevenue: totalRevenue, // Display Total or Monthly? Prompt says "Sum of all RECOGNIZED_REVENUE entries" -> Total?
    // "The Pulse... Revenue minus Burn". If Revenue is Total and Burn is Monthly, it's weird.
    // But "Recognized Revenue" usually means Total Recognized to date?
    // Let's return Total as 'recognizedRevenue' but use Monthly for 'netPosition'.
    // Or maybe Net Position is "Wallet Balance" change?
    // "The Pulse (Net Position): Revenue minus Burn".
    // I'll stick to Monthly Revenue - Monthly Burn for Pulse.
    netPosition,
    walletBalance,
    dailyBurn,
    runwayDays
  }
}
