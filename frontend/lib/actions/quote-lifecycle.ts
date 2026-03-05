'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function sendQuote(quoteId: string) {
  const supabase = createServerSupabaseClient()
  
  // 1. Verify user has access (RLS handles this but good to check existence)
  const { data: quote, error: fetchError } = await supabase
    .from('quotes')
    .select('status, share_token')
    .eq('id', quoteId)
    .single()
    
  if (fetchError || !quote) {
    throw new Error('Quote not found')
  }

  // 2. Validate state transition
  if (quote.status !== 'DRAFT') {
    throw new Error('Only DRAFT quotes can be sent')
  }

  // 3. Update status
  const { error: updateError } = await supabase
    .from('quotes')
    .update({ status: 'SENT' })
    .eq('id', quoteId)

  if (updateError) {
    throw new Error('Failed to update quote status')
  }

  // 4. Revalidate and redirect
  revalidatePath('/quotes')
  revalidatePath(`/quotes/${quoteId}`)
  
  // Return the share URL so the UI can show it or redirect
  return { 
    success: true, 
    shareUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/view/${quote.share_token}` 
  }
}
