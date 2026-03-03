'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'

export interface PublicQuoteData {
  id: string
  status: string
  vat_rate: number
  quote_amount_net: number
  quote_amount_gross: number
  reference: string | null
  valid_until: string | null
  created_at: string
  org_name: string
  client_name: string | null
  sections: {
    title: string
    trade_type: string | null
    section_revenue_total: number
  }[]
  line_items: {
    description: string
    quantity: number
    unit: string
    unit_price_net: number
    line_total_net: number
  }[]
}

/**
 * Fetch a quote by share_token for public view.
 * Uses service role to bypass RLS (this is the public share endpoint).
 * Exposes ONLY client-facing data — no costs, margins, or internal figures.
 */
export async function getPublicQuote(shareToken: string): Promise<PublicQuoteData | null> {
  const supabase = createServiceRoleClient()

  // Fetch quote by share_token
  const { data: quote, error } = await supabase
    .from('quotes')
    .select(`
      id, status, vat_rate, quote_amount_net, quote_amount_gross,
      reference, valid_until, created_at,
      organisations ( name ),
      clients ( name )
    `)
    .eq('share_token', shareToken)
    .single()

  if (error || !quote) return null

  // Fetch sections (only titles + revenue — NO costs/margins)
  const { data: sections } = await supabase
    .from('quote_sections')
    .select('title, trade_type, section_revenue_total')
    .eq('quote_id', quote.id)
    .order('sort_order', { ascending: true })

  // Fetch line items (client-facing description + pricing)
  const { data: lineItems } = await supabase
    .from('quote_line_items')
    .select('description, quantity, unit, unit_price_net, line_total_net')
    .eq('quote_id', quote.id)
    .order('sort_order', { ascending: true })

  return {
    id: quote.id,
    status: quote.status,
    vat_rate: quote.vat_rate,
    quote_amount_net: quote.quote_amount_net,
    quote_amount_gross: quote.quote_amount_gross,
    reference: quote.reference,
    valid_until: quote.valid_until,
    created_at: quote.created_at,
    org_name: (quote as any).organisations?.name ?? 'TradeLife',
    client_name: (quote as any).clients?.name ?? null,
    sections: sections ?? [],
    line_items: lineItems ?? [],
  }
}

/**
 * Accept a quote via share_token.
 * Sets status to ACCEPTED — triggers immutability.
 */
export async function acceptQuote(shareToken: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceRoleClient()

  // Verify quote exists and is in SENT status
  const { data: quote, error: fetchError } = await supabase
    .from('quotes')
    .select('id, status')
    .eq('share_token', shareToken)
    .single()

  if (fetchError || !quote) {
    return { success: false, error: 'Quote not found' }
  }

  if (quote.status === 'ACCEPTED') {
    return { success: true } // Already accepted — idempotent
  }

  if (quote.status !== 'SENT') {
    return { success: false, error: 'This quote cannot be accepted in its current state' }
  }

  // Update to ACCEPTED
  const { error: updateError } = await supabase
    .from('quotes')
    .update({ status: 'ACCEPTED' })
    .eq('id', quote.id)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  return { success: true }
}
