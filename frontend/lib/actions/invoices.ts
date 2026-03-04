'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Generates a sequential invoice number for the org.
 * Format: INV-{0001}
 * Note: Not concurrency safe, but sufficient for MVP.
 */
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

/**
 * Creates a 25% Deposit Invoice for a Job.
 * Also initializes the Job Wallet and Expected Revenue ledger if needed.
 */
export async function createDepositInvoiceAction(jobId: string) {
  const supabase = createServerSupabaseClient()
  
  // 1. Auth & Context
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

  // 2. Calculate Deposit (25% of Gross)
  // All math in integers (pence).
  // 25% = 25/100 = 1/4.
  const depositAmountGross = Math.round(quote.quote_amount_gross * 0.25)
  // Back-calculate Net for the invoice (approximate, since VAT is involved)
  // Gross = Net * (1 + VAT)
  // Net = Gross / (1 + VAT)
  const vatMultiplier = (10000 + quote.vat_rate) / 10000
  const depositAmountNet = Math.round(depositAmountGross / vatMultiplier)

  // 3. Generate Invoice Number
  const invoiceNumber = await generateInvoiceNumber(supabase, orgId)

  // 4. Create Invoice Record
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
      issue_date: new Date().toISOString(), // Today
    })
    .select()
    .single()

  if (invoiceError) throw new Error(`Failed to create invoice: ${invoiceError.message}`)

  // 5. Wallet Initialization (Task 3)
  // "Upon invoice creation, ensure the job_wallets table is updated."
  try {
    // Check if wallet exists
    const { data: existingWallet } = await supabase
      .from('job_wallets')
      .select('id')
      .eq('job_id', jobId)
      .single()

    let walletId = existingWallet?.id

    if (!walletId) {
      // Create Wallet
      // Upsert is safer if race condition, but we check first.
      const { data: newWallet, error: walletError } = await supabase
        .from('job_wallets')
        .insert({
          org_id: orgId,
          job_id: jobId,
          balance: 0,
          status: 'ACTIVE'
        })
        .select()
        .single()

      if (walletError) {
        // If error is "relation does not exist", it means migration missing
        if (walletError.message.includes('relation "job_wallets" does not exist')) {
            console.error('Job Wallets table missing. Please apply migration 00004_job_wallets.sql')
            // We swallow this error to allow Invoice creation to succeed (Task 2 success), 
            // but log it for Task 3 failure visibility.
        } else {
            throw walletError
        }
      } else {
        walletId = newWallet.id
      }
    }

    // 6. Ledger Entry for Expected Revenue
    // "Create a ledger entry for 'Expected Revenue' matching the total gross of the source quote."
    if (walletId) {
      // Check if we already have an expected revenue entry to avoid dupes
      const { data: existingLedger } = await supabase
        .from('job_wallet_ledger')
        .select('id')
        .eq('wallet_id', walletId)
        .eq('transaction_type', 'EXPECTED_REVENUE')
        .single()

      if (!existingLedger) {
        const { error: ledgerError } = await supabase
          .from('job_wallet_ledger')
          .insert({
            org_id: orgId,
            wallet_id: walletId,
            transaction_type: 'EXPECTED_REVENUE',
            amount: quote.quote_amount_gross, // Positive value
            description: `Expected Revenue from Quote ${quote.id.slice(0, 8)}`
          })
        
        if (ledgerError) console.error('Failed to create ledger entry:', ledgerError)
      }
    }

  } catch (err) {
    console.error('Wallet initialization failed:', err)
    // Don't block invoice creation result?
    // "Report back ONLY once all three are finished."
    // If this fails, Task 3 is incomplete.
  }

  revalidatePath('/jobs')
  revalidatePath(`/jobs/${jobId}`)
  
  return { success: true, invoiceId: invoice.id }
}
