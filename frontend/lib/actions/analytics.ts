'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getAnalyticsData() {
  const supabase = createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()

  if (!profile) throw new Error('Profile not found')

  // 1. Gross Revenue (Total Invoiced/Paid)
  // Or recognized revenue from ledger? Ledger is truth.
  const { data: ledger } = await supabase
    .from('job_wallet_ledger')
    .select('amount, transaction_type')
    .eq('org_id', profile.org_id)
    .eq('transaction_type', 'CREDIT') // Only income

  const grossRevenue = ledger?.reduce((sum, entry) => sum + entry.amount, 0) || 0

  // 2. Net Profit
  // Sum of Profit Pot balance + Tax Pot? 
  // Or Profit = Revenue - Expenses (Debits).
  const { data: expenses } = await supabase
    .from('job_wallet_ledger')
    .select('amount')
    .eq('org_id', profile.org_id)
    .eq('transaction_type', 'DEBIT')

  const totalExpenses = expenses?.reduce((sum, entry) => sum + entry.amount, 0) || 0
  const netProfit = grossRevenue - totalExpenses

  // 3. Top Trade Types
  const { data: sections } = await supabase
    .from('quote_sections')
    .select('trade_type, section_revenue_total')
    .eq('org_id', profile.org_id)

  const trades: Record<string, number> = {}
  sections?.forEach(s => {
    const type = s.trade_type || 'General'
    trades[type] = (trades[type] || 0) + s.section_revenue_total
  })

  const topTrades = Object.entries(trades)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }))

  return {
    grossRevenue,
    netProfit,
    topTrades
  }
}
