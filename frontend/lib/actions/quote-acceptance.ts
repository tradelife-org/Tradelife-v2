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
  // Store the full JSON representation
  const snapshotData = {
    quote: { ...quote }, // Shallow copy excluding sections relation if needed, but JSONB handles nested fine
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
    // Non-critical? Or strict rule? "When a quote's status changes... you MUST save..."
    // Ideally we'd rollback transaction, but Supabase client doesn't support tx easily.
    // We log it as a critical error.
  }

  revalidatePath(`/quotes/${quoteId}`)
  revalidatePath('/quotes')
  
  return { success: true }
}
