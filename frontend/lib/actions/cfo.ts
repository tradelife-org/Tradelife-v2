'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getBankBalance } from '@/lib/actions/banking'
import { generateFlashJSON } from '@/lib/ai/gemini'

export async function generateCFOInsight() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) throw new Error('Profile not found')

  // 1. Gather Data
  const bankBalance = await getBankBalance() // Pence
  
  const { data: ledger } = await supabase
    .from('job_wallet_ledger')
    .select('amount, transaction_type')
    .eq('org_id', profile.org_id)
  
  const revenue = ledger?.filter(e => e.transaction_type === 'CREDIT').reduce((s, e) => s + e.amount, 0) || 0
  const expenses = ledger?.filter(e => e.transaction_type === 'DEBIT').reduce((s, e) => s + e.amount, 0) || 0
  
  // 2. Ask Jarvis
  const prompt = `You are an expert CFO. Analyze this data (in pence):
  - Bank Balance: ${bankBalance}
  - Total Revenue: ${revenue}
  - Total Expenses: ${expenses}
  
  Provide 3 short, punchy strategic insights or warnings.
  Return JSON: { insights: string[] }`

  const res = await generateFlashJSON(prompt)
  return res.insights || []
}
