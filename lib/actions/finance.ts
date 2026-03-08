'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generateFlashJSON } from '@/lib/ai/gemini'
import { revalidatePath } from 'next/cache'

// ... existing code ...

// ============================================================================
// RECEIPT PROCESSING
// ============================================================================

export async function processReceiptAction(formData: FormData) {
  const supabase = createServerSupabaseClient()
  
  const jobId = formData.get('jobId') as string
  const file = formData.get('file') as File
  
  if (!jobId || !file) throw new Error('Missing job or file')

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) throw new Error('Profile not found')

  // 2. Upload Image
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const filePath = `receipts/${profile.org_id}/${Date.now()}_${file.name}`
  
  const { error: uploadError } = await supabase.storage
    .from('gallery')
    .upload(filePath, buffer, { contentType: file.type })

  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

  // 3. AI Analysis (Gemini Flash)
  const base64Image = buffer.toString('base64')
  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: file.type
    }
  }

  const prompt = `Analyze this receipt image. Extract:
  - Merchant Name
  - Date (YYYY-MM-DD)
  - Total Amount in PENCE (e.g. £10.50 -> 1050).
  Return JSON: { merchant: string, date: string, amount: number }.`

  let analysis
  try {
    analysis = await generateFlashJSON(prompt, [imagePart])
  } catch (err) {
    console.error('AI Analysis failed:', err)
    throw new Error('Failed to analyze receipt')
  }

  // 4. Ledger Write (DEBIT)
  // Find Wallet
  const { data: wallet } = await supabase
    .from('job_wallets')
    .select('id')
    .eq('job_id', jobId)
    .single()

  let walletId = wallet?.id
  if (!walletId) {
    // Create wallet if missing
    const { data: newWallet, error: createError } = await supabase
      .from('job_wallets')
      .insert({ org_id: profile.org_id, job_id: jobId })
      .select('id')
      .single()
    
    if (createError || !newWallet) {
        throw new Error(`Failed to create job wallet: ${createError?.message}`)
    }
    walletId = newWallet.id
  }

  const { error: ledgerError } = await supabase
    .from('job_wallet_ledger')
    .insert({
      org_id: profile.org_id,
      wallet_id: walletId,
      transaction_type: 'DEBIT',
      amount: analysis.amount,
      description: `Receipt: ${analysis.merchant} (${analysis.date})`,
    })

  if (ledgerError) throw new Error(`Ledger update failed: ${ledgerError.message}`)

  revalidatePath('/finance')
  revalidatePath(`/jobs/${jobId}`)
  
  return { success: true, data: analysis }
}

// ... existing dashboard code ...
// Re-exporting dashboard data function for safety if it was cut off in update
export async function getFinanceDashboardData() {
  const supabase = createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) throw new Error('Profile not found')

  // 1. Get Money Pots (Allocations)
  const { data: pots } = await supabase
    .from('money_pots')
    .select('*')
    .eq('org_id', profile.org_id)

  // 2. Aggregate Job Wallet Ledger (Income/Revenue)
  const { data: ledger } = await supabase
    .from('job_wallet_ledger')
    .select('amount, transaction_type, created_at')
    .eq('org_id', profile.org_id)

  // Calculate Totals
  let totalRevenue = 0
  let totalExpenses = 0
  
  const now = new Date()
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(now.getMonth() - 3)
  
  let expensesLast3Months = 0

  ledger?.forEach(entry => {
    if (entry.transaction_type === 'CREDIT') {
      totalRevenue += entry.amount
    } else {
      totalExpenses += entry.amount
      if (new Date(entry.created_at) > threeMonthsAgo) {
        expensesLast3Months += entry.amount
      }
    }
  })

  // Burn Rate (Monthly Average over last 3 months, or 1 if less)
  const burnRate = Math.round(expensesLast3Months / 3) 
  
  // Current Balance
  const currentBalance = totalRevenue - totalExpenses

  // Runway (Months)
  const runway = burnRate > 0 ? (currentBalance / burnRate) : 999

  // Calculate Pot Values
  const potAllocations = pots?.map(pot => ({
    ...pot,
    value: Math.round(currentBalance * (pot.allocation_percentage / 10000))
  })) || []

  return {
    totalRevenue,
    totalExpenses,
    currentBalance,
    burnRate,
    runway,
    pots: potAllocations
  }
}
