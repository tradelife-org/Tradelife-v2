'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generateContent } from '@/lib/ai/gemini'
import { revalidatePath } from 'next/cache'

export interface ReceiptData {
  supplier: string
  totalAmount: number // pence
  vatAmount: number // pence
  description: string
}

export async function ocrReceiptAction(formData: FormData): Promise<ReceiptData> {
  const file = formData.get('file') as File
  if (!file) throw new Error('No file provided')

  // Convert to base64
  const arrayBuffer = await file.arrayBuffer()
  const base64Data = Buffer.from(arrayBuffer).toString('base64')
  
  const mimeType = file.type

  // Gemini OCR
  const prompt = `
    Analyze this receipt image.
    Extract:
    1. Supplier Name
    2. Total Amount (parse currency, convert to PENCE integer)
    3. VAT Amount (parse currency, convert to PENCE integer). If not found, estimate 20% of net or 0 if explicit.
    4. Brief Description (e.g. "Materials for kitchen")
    
    Return JSON:
    {
      "supplier": "string",
      "totalAmount": number,
      "vatAmount": number,
      "description": "string"
    }
  `
  
  const imagePart = {
    inline_data: {
      mime_type: mimeType,
      data: base64Data
    }
  }

  try {
    const text = await generateContent(prompt, true, [imagePart])
    const data = JSON.parse(text)
    return data as ReceiptData
  } catch (err) {
    console.error('Receipt OCR failed:', err)
    throw new Error('Failed to analyze receipt')
  }
}

export async function confirmReceiptAction(jobId: string, data: ReceiptData) {
  const supabase = createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) throw new Error('Profile not found')

  // Insert Expense into Ledger
  // Category: EXPENSE
  // Transaction: DEBIT
  const { error } = await supabase
    .from('job_wallet_ledger')
    .insert({
      org_id: profile.org_id,
      job_id: jobId,
      amount: data.totalAmount, // Absolute amount
      transaction_type: 'DEBIT',
      category: 'EXPENSE',
      description: `${data.supplier}: ${data.description}`
    })

  if (error) {
    console.error('Ledger expense failed:', error)
    throw new Error('Failed to save expense')
  }

  revalidatePath(`/jobs/${jobId}`)
  return { success: true }
}
