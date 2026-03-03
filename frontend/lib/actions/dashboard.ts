'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface QuoteListItem {
  id: string
  status: string
  reference: string | null
  quote_amount_net: number
  quote_amount_gross: number
  quote_total_cost: number
  quote_profit: number
  quote_margin_percentage: number
  vat_rate: number
  created_at: string
  updated_at: string
  client_name: string | null
}

export async function getQuotes(): Promise<QuoteListItem[]> {
  const supabase = createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile) return []

  // Fetch quotes with client name via join
  const { data, error } = await supabase
    .from('quotes')
    .select(`
      id, status, reference,
      quote_amount_net, quote_amount_gross, quote_total_cost,
      quote_profit, quote_margin_percentage, vat_rate,
      created_at, updated_at,
      clients ( name )
    `)
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((q: any) => ({
    id: q.id,
    status: q.status,
    reference: q.reference,
    quote_amount_net: q.quote_amount_net,
    quote_amount_gross: q.quote_amount_gross,
    quote_total_cost: q.quote_total_cost,
    quote_profit: q.quote_profit,
    quote_margin_percentage: q.quote_margin_percentage,
    vat_rate: q.vat_rate,
    created_at: q.created_at,
    updated_at: q.updated_at,
    client_name: q.clients?.name ?? null,
  }))
}
