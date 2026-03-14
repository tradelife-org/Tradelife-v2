import { createClient } from '@supabase/supabase-js'

export async function generateBurnRateSnapshot(orgId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
  )
  // 1. Query job_wallet_ledger for current month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: ledgers, error } = await supabase
    .from('job_wallet_ledger')
    .select('amount, transaction_type')
    .eq('org_id', orgId)
    .gte('created_at', startOfMonth.toISOString())

  if (error) {
    console.error(`Failed to fetch ledger for org ${orgId}:`, error)
    return
  }

  // 2. Calculate
  let monthly_revenue = 0
  let monthly_expenses = 0

  for (const entry of ledgers || []) {
    if (entry.transaction_type === 'CREDIT') monthly_revenue += entry.amount
    if (entry.transaction_type === 'DEBIT') monthly_expenses += entry.amount
  }

  const profit = monthly_revenue - monthly_expenses
  const burn_rate = monthly_expenses // simplified metric: how much we spend per month
  
  // Calculate cash runway (assuming we fetch bank balance, but we'll just use 0 if not connected to avoid failing)
  let runway = 0
  const { data: bankConn } = await supabase
    .from('bank_connections')
    .select('access_token')
    .eq('org_id', orgId)
    .limit(1)
    .maybeSingle()

  if (bankConn) {
     // Ideally we fetch actual balance from Plaid here, but to keep worker fast and non-blocking
     // we'll leave runway calculation as a placeholder or basic estimation based on ledger balance
     const { data: allLedgers } = await supabase.from('job_wallet_ledger').select('amount, transaction_type').eq('org_id', orgId)
     let totalCash = 0
     for (const e of allLedgers || []) {
       if (e.transaction_type === 'CREDIT') totalCash += e.amount
       if (e.transaction_type === 'DEBIT') totalCash -= e.amount
     }
     runway = burn_rate > 0 ? Math.round(totalCash / burn_rate) : 999
  }

  // 3. Insert snapshot
  await supabase.from('burn_rate_snapshots').insert({
    org_id: orgId,
    revenue: monthly_revenue,
    expenses: monthly_expenses,
    profit: profit,
    burn_rate: burn_rate,
    runway: runway,
    created_at: new Date().toISOString()
  })
}

export async function generateBurnRateSnapshotForAllOrgs() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
  )

  const { data: orgs, error } = await supabase
    .from('organisations')
    .select('id')

  if (error) {
    console.error('Failed to fetch organisations:', error)
    return
  }

  for (const org of orgs || []) {
    await generateBurnRateSnapshot(org.id)
  }
}
