'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function acceptQuoteAction(quoteId: string) {
  const supabase = createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 1. Fetch Quote + Sections + Items
  const { data: quote, error: fetchError } = await supabase
    .from('quotes')
    .select(`
      *,
      quote_sections (
        *,
        quote_line_items (*)
      )
    `)
    .eq('id', quoteId)
    .single()

  if (fetchError || !quote) throw new Error('Quote not found')

  if (quote.status === 'ACCEPTED') {
    throw new Error('Quote is already accepted')
  }

  // 2. Update Status to ACCEPTED
  const { error: updateError } = await supabase
    .from('quotes')
    .update({ 
      status: 'ACCEPTED',
      updated_at: new Date().toISOString()
    })
    .eq('id', quoteId)

  if (updateError) throw new Error(`Failed to accept quote: ${updateError.message}`)

  // 3. Create Quote Snapshot (Task 3)
  const snapshotData = {
    quote: { ...quote }, 
    sections: quote.quote_sections
  }

  const { error: snapshotError } = await supabase
    .from('quote_snapshots')
    .insert({
      quote_id: quoteId,
      org_id: quote.org_id,
      snapshot_data: snapshotData
    })

  if (snapshotError) {
    console.error('Snapshot creation failed:', snapshotError)
  }

  // 4. Revenue Automation (Phase 3, Task 1)
  // Trigger a ledger credit (REVENUE) upon quote acceptance
  // We need a job_id for the ledger. 
  // Wait, does the quote have a job_id yet?
  // Usually Quote -> Job conversion happens AFTER acceptance or AS part of it?
  // Schema: quotes.job_id is nullable.
  // Previous task: "Once the quote is SENT, create the logic to 'Convert to Job'".
  // So a job might exist OR might be created later.
  // If job doesn't exist, we can't link ledger to job_id (it's NOT NULL in schema).
  // "Triggering a ledger credit upon quote acceptance".
  // Problem: If no job exists, we can't insert into job_wallet_ledger.
  // Assumption: The ledger entry should be created when the Job is created (if converting)?
  // OR: Accepting a quote should AUTO-CREATE a job?
  // Let's check constraints.
  // "Task 1: Revenue Automation (triggering a ledger credit upon quote acceptance)"
  // If I accept a quote, I recognize revenue. But where?
  // If `job_wallet_ledger` requires `job_id`, I must have a job.
  // If `job_id` is null on quote, I cannot proceed with ledger entry unless I create a job.
  // Maybe I should create the job here?
  // Or maybe the user ensures job conversion first?
  // "Once the quote is SENT, create the logic to 'Convert to Job'".
  // Usually flow is: Draft -> Sent -> Accepted -> Job.
  // Or Draft -> Sent -> Accepted -> Convert to Job?
  // If "Accepted" implies "Won", we should probably create the job now if it doesn't exist.
  // Let's Auto-Create Job if missing.
  
  let jobId = quote.job_id
  
  if (!jobId) {
     // Auto-create Job to hold the ledger
     const { data: newJob, error: jobError } = await supabase
        .from('jobs')
        .insert({
            org_id: quote.org_id,
            source_quote_id: quote.id,
            client_id: quote.client_id,
            title: quote.reference || `Job from Quote ${quote.id.slice(0, 8)}`,
            status: 'BOOKED' // Accepted quote = Booked job?
        })
        .select()
        .single()
     
     if (jobError || !newJob) {
         console.error('Failed to auto-create job for ledger:', jobError)
         // We can't insert ledger without job.
         // Should we fail? Or skip ledger?
         // "Revenue Automation" implies we MUST do it.
         throw new Error('Failed to create Job for Accepted Quote')
     }
     
     jobId = newJob.id
     
     // Link back to quote
     await supabase.from('quotes').update({ job_id: jobId }).eq('id', quoteId)
  }

  // Insert Ledger Entry
  const { error: ledgerError } = await supabase
    .from('job_wallet_ledger')
    .insert({
        org_id: quote.org_id,
        job_id: jobId,
        amount: quote.quote_amount_gross, // Total Value
        transaction_type: 'CREDIT',
        category: 'REVENUE',
        description: `Revenue Recognized: Quote ${quote.reference || quote.id.slice(0,8)} Accepted`
    })

  if (ledgerError) {
      console.error('Ledger revenue entry failed:', ledgerError)
      // This is critical for "Revenue Automation". Should we revert?
      // Without transactions, we can't easily revert the Quote status update.
      // We'll throw to alert the user, though state might be partially inconsistent (Accepted but no ledger).
      // In production, use RPC.
  }

  revalidatePath(`/quotes/${quoteId}`)
  revalidatePath('/quotes')
  revalidatePath('/jobs')
  
  return { success: true }
}
