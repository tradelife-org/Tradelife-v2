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

  const arrayBuffer = await file.arrayBuffer()
  const base64Data = Buffer.from(arrayBuffer).toString('base64')
  const mimeType = file.type

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

  // Fetch Profile & Org Settings
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()
  if (!profile) throw new Error('Profile not found')

  const { data: org } = await supabase
    .from('organisations')
    .select('is_vat_registered')
    .eq('id', profile.org_id)
    .single()
  
  // Note: is_vat_registered defaults to false in schema if missing, 
  // but if column missing (migration failed), fetch might fail or return null.
  // We'll treat null as false.
  const isVatRegistered = org?.is_vat_registered || false

  // Call RPC Transaction
  const { error } = await supabase.rpc('record_expense_transaction', {
    p_org_id: profile.org_id,
    p_job_id: jobId,
    p_total_amount: data.totalAmount,
    p_vat_amount: data.vatAmount,
    p_description: `${data.supplier}: ${data.description}`,
    p_is_vat_registered: isVatRegistered
  })

  if (error) {
    console.error('Ledger expense failed:', error)
    
    // Fallback: If RPC missing (migration failed), do logic manually (non-transactional risk)
    if (error.code === '42883') { // undefined_function
       console.warn('RPC missing, falling back to manual insert (Non-Transactional)')
       // Fallback Logic
       if (isVatRegistered) {
           await supabase.from('job_wallet_ledger').insert([
               {
                   org_id: profile.org_id, job_id: jobId, amount: data.totalAmount - data.vatAmount,
                   transaction_type: 'DEBIT', category: 'EXPENSE', description: `${data.supplier}: ${data.description} (Net)`
               },
               {
                   org_id: profile.org_id, job_id: jobId, amount: data.vatAmount,
                   transaction_type: 'DEBIT', category: 'VAT_RECLAIM', description: `${data.supplier}: ${data.description} (VAT Reclaim)`
               }
           ])
       } else {
           await supabase.from('job_wallet_ledger').insert({
               org_id: profile.org_id, job_id: jobId, amount: data.totalAmount,
               transaction_type: 'DEBIT', category: 'EXPENSE', description: `${data.supplier}: ${data.description}`
           })
       }
    } else {
        throw new Error('Failed to save expense')
    }
  }

  revalidatePath(`/jobs/${jobId}`)
  return { success: true }
}
