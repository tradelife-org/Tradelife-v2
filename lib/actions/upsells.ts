'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addUpsell(quoteId: string, data: {
  title: string
  description?: string
  price: number
  cost?: number
  imageUrl?: string
}) {
  const supabase = createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  const { error } = await supabase
    .from('quote_upsells')
    .insert({
      org_id: profile.org_id,
      quote_id: quoteId,
      title: data.title,
      description: data.description,
      price_total: data.price,
      cost_total: data.cost || 0,
      image_url: data.imageUrl
    })

  if (error) throw new Error(error.message)

  revalidatePath(`/quotes/${quoteId}`)
}

export async function toggleUpsell(upsellId: string, accepted: boolean) {
  // This might be called by the client (public) or admin.
  // For public (client portal), we might need a separate action or RLS check on the token.
  // Assuming Admin use for Phase 4 Quote Builder.
  
  const supabase = createServerSupabaseClient()
  
  // Basic Auth Check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('quote_upsells')
    .update({ accepted })
    .eq('id', upsellId)

  if (error) throw new Error(error.message)

  // We should also trigger a quote recalculation if upsells affect the total?
  // Currently Quote Total is Section-based. Upsells might be separate "add-ons".
  // For now, they are independent.
  
  revalidatePath('/quotes')
}

export async function deleteUpsell(upsellId: string) {
  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('quote_upsells')
    .delete()
    .eq('id', upsellId)

  if (error) throw new Error(error.message)
}
