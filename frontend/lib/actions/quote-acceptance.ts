'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function acceptQuoteAction(quoteId: string) {
  const supabase = createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 1. Fetch Quote
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

  // 2. Update Status
  const { error: updateError } = await supabase
    .from('quotes')
    .update({ 
      status: 'ACCEPTED',
      updated_at: new Date().toISOString()
    })
    .eq('id', quoteId)

  if (updateError) throw new Error(`Failed to accept quote: ${updateError.message}`)

  // 3. Snapshot
  const snapshotData = {
    quote: { ...quote }, 
    sections: quote.quote_sections
  }

  await supabase
    .from('quote_snapshots')
    .insert({
      quote_id: quoteId,
      org_id: quote.org_id,
      snapshot_data: snapshotData
    })

  // 4. Ensure Job Exists
  let jobId = quote.job_id
  if (!jobId) {
     const { data: newJob } = await supabase
        .from('jobs')
        .insert({
            org_id: quote.org_id,
            source_quote_id: quote.id,
            client_id: quote.client_id,
            title: quote.reference || `Job from Quote ${quote.id.slice(0, 8)}`,
            status: 'BOOKED'
        })
        .select()
        .single()
     
     if (newJob) {
         jobId = newJob.id
         await supabase.from('quotes').update({ job_id: jobId }).eq('id', quoteId)
         
         // Also initialize Job Wallet if needed
         await supabase.from('job_wallets').insert({
             org_id: quote.org_id,
             job_id: jobId,
             balance: 0,
             status: 'ACTIVE'
         }).select()
     }
  }

  // 5. Accounting Correction: COMMITTED_REVENUE
  if (jobId) {
      const { error: ledgerError } = await supabase
        .from('job_wallet_ledger')
        .insert({
            org_id: quote.org_id,
            job_id: jobId,
            amount: quote.quote_amount_gross,
            transaction_type: 'CREDIT',
            category: 'COMMITTED_REVENUE', // Requires Migration 00007
            description: `Committed Revenue: Quote ${quote.reference || quote.id.slice(0,8)} Accepted`
        })

      if (ledgerError) console.error('Ledger committed revenue failed:', ledgerError)
  }

  revalidatePath(`/quotes/${quoteId}`)
  revalidatePath('/quotes')
  revalidatePath('/jobs')
  
  return { success: true }
}
