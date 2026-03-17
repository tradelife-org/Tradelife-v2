'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function acceptQuoteAction(quoteId: string) {
  const supabase = await createServerSupabaseClient()
  
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
  // Removed automatic job creation. Tradesperson will convert manually.

  revalidatePath(`/quotes/${quoteId}`)
  revalidatePath('/quotes')
  
  return { success: true }
}
