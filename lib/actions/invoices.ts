'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createInvoiceAction(data: {
  jobId: string
  type: 'DEPOSIT' | 'INTERIM' | 'FINAL'
  depositPercentage?: number // 0-100 integer
  dueDate: string // ISO date
  notes?: string
}) {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  // 1. Fetch Job & Linked Quote Snapshot
  const { data: job } = await supabase
    .from('jobs')
    .select(`
      *,
      quotes!jobs_source_quote_id_fkey ( 
        id, 
        accepted_snapshot_id,
        quote_snapshots!quotes_accepted_snapshot_id_fkey (
          snapshot_data,
          total_amount_gross
        )
      )
    `)
    .eq('id', data.jobId)
    .single()

  if (!job) throw new Error('Job not found')

  const snapshot = job.quotes?.quote_snapshots?.snapshot_data
  const totalGross = job.quotes?.quote_snapshots?.total_amount_gross || 0
  
  // 2. Calculate Amounts
  let amountNet = 0
  let amountGross = 0
  let vatRate = snapshot?.vat_rate || 2000

  if (data.type === 'DEPOSIT' && data.depositPercentage) {
    amountGross = Math.round((totalGross * data.depositPercentage) / 100)
    amountNet = Math.round((amountGross * 10000) / (10000 + vatRate))
  } else {
    amountGross = totalGross
    amountNet = snapshot?.quote_amount_net || 0
  }

  // 3. Generate Invoice Number
  const { count } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', profile.org_id)
  
  const invoiceNumber = `INV-${new Date().getFullYear()}-${(count || 0) + 1001}`

  // 4. Create Invoice
  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      org_id: profile.org_id,
      source_job_id: data.jobId,
      invoice_number: invoiceNumber,
      invoice_type: data.type,
      amount_net: amountNet,
      amount_gross: amountGross,
      vat_rate: vatRate,
      status: 'DRAFT',
      issue_date: new Date().toISOString(),
      due_date: data.dueDate
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  // 5. Create Line Item
  const firstLineId = await getFirstJobLineId(supabase, data.jobId)
  if (firstLineId) {
    await supabase.from('invoice_line_items').insert({
      org_id: profile.org_id,
      invoice_id: invoice.id,
      source_job_line_id: firstLineId,
      description: `${data.type} Invoice - ${data.depositPercentage || 100}% of Project`,
      quantity: 1,
      unit: 'lot',
      unit_price_net: amountNet,
      line_total_net: amountNet,
      sort_order: 0
    })
  }

  // 6. Record RECOGNISED_REVENUE in Ledger
  await supabase.from('job_wallet_ledger').insert({
    org_id: profile.org_id,
    job_id: data.jobId,
    amount: amountGross,
    transaction_type: 'CREDIT',
    category: 'RECOGNISED_REVENUE',
    description: `Invoice Generated: ${invoiceNumber}`
  })

  revalidatePath('/invoices')
  redirect(`/invoices/${invoice.id}`)
}

async function getFirstJobLineId(supabase: any, jobId: string) {
  const { data } = await supabase
    .from('job_line_items')
    .select('id')
    .eq('job_id', jobId)
    .limit(1)
    .single()
  return data?.id
}

export async function sendInvoiceAction(invoiceId: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('invoices')
    .update({ status: 'SENT' })
    .eq('id', invoiceId)
  
  if (error) throw new Error(error.message)
  revalidatePath('/invoices')
  revalidatePath(`/invoices/${invoiceId}`)
}

export async function markInvoicePaidAction(invoiceId: string) {
  const supabase = await createServerSupabaseClient()
  
  // 1. Fetch Invoice
  const { data: invoice, error: fetchErr } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single()

  if (fetchErr || !invoice) throw new Error('Invoice not found')

  // 2. Update Invoice Status
  const { error } = await supabase
    .from('invoices')
    .update({ 
      status: 'PAID',
      paid_at: new Date().toISOString()
    })
    .eq('id', invoiceId)
  
  if (error) throw new Error(error.message)

  // 3. Record REVENUE in Ledger
  await supabase.from('job_wallet_ledger').insert({
    org_id: invoice.org_id,
    job_id: invoice.source_job_id,
    amount: invoice.amount_gross,
    transaction_type: 'CREDIT',
    category: 'REVENUE',
    description: `Payment Received: ${invoice.invoice_number}`
  })

  // 4. Payment Protect Placeholder: Service Fee Expense
  // Assume a 1.5% placeholder service fee
  const serviceFee = Math.round(invoice.amount_gross * 0.015)
  await supabase.from('job_wallet_ledger').insert({
    org_id: invoice.org_id,
    job_id: invoice.source_job_id,
    amount: serviceFee,
    transaction_type: 'DEBIT',
    category: 'EXPENSE',
    description: `Payment Protect Service Fee (1.5%) for ${invoice.invoice_number}`
  })

  revalidatePath('/invoices')
  revalidatePath(`/invoices/${invoiceId}`)
}
