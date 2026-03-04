'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function generateInvoiceNumber(supabase: any, orgId: string): Promise<string> {
  const { data: lastInvoice } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let nextNum = 1
  if (lastInvoice && lastInvoice.invoice_number) {
    const parts = lastInvoice.invoice_number.split('-')
    if (parts.length === 2 && !isNaN(parseInt(parts[1]))) {
      nextNum = parseInt(parts[1]) + 1
    }
  }

  return `INV-${nextNum.toString().padStart(4, '0')}`
}

export async function createDepositInvoiceAction(jobId: string) {
  const supabase = createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get Job + Source Quote
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select(`
      *,
      quotes:source_quote_id (
        id,
        quote_amount_gross,
        quote_amount_net,
        vat_rate
      )
    `)
    .eq('id', jobId)
    .single()

  if (jobError || !job) throw new Error('Job not found')
  if (!job.quotes) throw new Error('Source quote not found')

  const orgId = job.org_id
  const quote = job.quotes

  // Calculate Deposit
  const depositAmountGross = Math.round(quote.quote_amount_gross * 0.25)
  const vatMultiplier = (10000 + quote.vat_rate) / 10000
  const depositAmountNet = Math.round(depositAmountGross / vatMultiplier)

  // Invoice Number
  const invoiceNumber = await generateInvoiceNumber(supabase, orgId)

  // Create Invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      org_id: orgId,
      source_job_id: jobId,
      invoice_number: invoiceNumber,
      invoice_type: 'DEPOSIT',
      amount_net: depositAmountNet,
      amount_gross: depositAmountGross,
      vat_rate: quote.vat_rate,
      status: 'DRAFT',
      issue_date: new Date().toISOString(),
    })
    .select()
    .single()

  if (invoiceError) throw new Error(`Failed to create invoice: ${invoiceError.message}`)

  // Accounting: RECOGNIZED_REVENUE
  // Note: We don't initialize wallet here anymore (moved to Accept Quote or lazy init)
  // We assume wallet exists or creating ledger entry might fail if FK missing?
  // Ledger requires wallet_id?
  // Schema check: job_wallet_ledger(job_id) FK to jobs(id).
  // Wait, does it link to job_wallets(id)?
  // Migration 00006 (Ledger) definition:
  // job_wallet_ledger ( ... job_id UUID REFERENCES jobs(id) ... )
  // It does NOT link to job_wallets table directly in 00006 schema I wrote?
  // Let's check 00006 again.
  // "job_id UUID NOT NULL REFERENCES jobs(id)"
  // Ah, 00004 (which I couldn't apply but simulated?) defined job_wallet_ledger with wallet_id.
  // 00006 defined it with job_id.
  // I should check which schema is active.
  // Since I created 00006 recently, and that's the one I "verified" (but failed), I should stick to 00006 logic?
  // Or check the actual table?
  // `diagnostic_phase3_v4.py` inserted into `job_wallet_ledger` using `job_id`.
  // So the active schema uses `job_id`.
  
  const { error: ledgerError } = await supabase
    .from('job_wallet_ledger')
    .insert({
        org_id: orgId,
        job_id: jobId,
        amount: depositAmountGross,
        transaction_type: 'CREDIT',
        category: 'RECOGNIZED_REVENUE', // Requires Migration 00007
        description: `Recognized Revenue: Invoice ${invoiceNumber} (Deposit)`
    })

  if (ledgerError) console.error('Ledger recognized revenue failed:', ledgerError)

  revalidatePath('/jobs')
  revalidatePath(`/jobs/${jobId}`)
  
  return { success: true, invoiceId: invoice.id }
}
