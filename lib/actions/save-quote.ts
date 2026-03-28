'use server'

import { revalidatePath } from 'next/cache'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { calculateSection, calculateQuoteTotals } from '@/lib/actions/quotes'

// --------------------------------------------------------------------------
// Types for the save action input
// --------------------------------------------------------------------------

interface SaveSectionInput {
  title: string
  trade_type: string
  sort_order: number
  is_subcontract: boolean
  labour_days: number
  labour_day_rate: number       // already pence (BigInt)
  subcontract_cost: number      // already pence
  material_cost_total: number   // already pence
  margin_percentage: number     // already x100
}

interface SaveQuoteInput {
  clientName: string
  vat_rate: number              // x100 (2000 = 20%)
  sections: SaveSectionInput[]
}

interface SaveQuoteResult {
  success: boolean
  quoteId?: string
  quote?: {
    id: string
    client_id: string
    status: string
    quote_amount_net: number
    quote_amount_gross: number
    quote_total_cost: number
    quote_profit: number
    quote_margin_percentage: number
  }
  error?: string
}

function normalizeClientName(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

function isUuid(value: string | null | undefined) {
  if (!value) return false

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

// --------------------------------------------------------------------------
// Server Action: saveQuoteDraft
// 
// 1. Gets the authenticated user's org_id
// 2. Recalculates all math server-side (source of truth)
// 3. Inserts quote + sections + line items in a single transaction
// 4. All values are already BigInt (pence/x100) from the UI conversion
// --------------------------------------------------------------------------

export async function saveQuoteDraft(input: SaveQuoteInput): Promise<SaveQuoteResult> {
  try {
    const supabase = await createServerSupabaseClient()

    // Step 1: Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Not authenticated. Please sign in.' }
    }

    // Step 2: Get user's org_id from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { success: false, error: 'Profile not found. Please contact support.' }
    }

    const org_id = profile.org_id

    const normalizedClientName = normalizeClientName(input.clientName)
    if (!normalizedClientName) {
      return { success: false, error: 'Client name is required.' }
    }

    let clientId = ''

    const { data: existingClients, error: existingClientError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('org_id', org_id)
      .ilike('name', normalizedClientName)
      .limit(10)

    if (existingClientError) {
      return { success: false, error: `Failed to find client: ${existingClientError.message}` }
    }

    const existingClient = (existingClients || []).find((client) => normalizeClientName(client.name).toLowerCase() === normalizedClientName.toLowerCase())

    if (existingClient?.id && isUuid(existingClient.id)) {
      clientId = existingClient.id
    } else {
      const { data: newClient, error: newClientError } = await supabase
        .from('clients')
        .insert({
          org_id,
          name: normalizedClientName,
        })
        .select('id')
        .single()

      if (newClientError || !newClient?.id || !isUuid(newClient.id)) {
        return { success: false, error: `Failed to create client: ${newClientError?.message}` }
      }

      clientId = newClient.id
    }

    if (!isUuid(clientId)) {
      return { success: false, error: 'Failed to resolve a valid client record for this quote.' }
    }

    // Step 3: Server-side recalculation (source of truth)
    const sectionCalcs = input.sections.map((s) =>
      calculateSection({
        is_subcontract: s.is_subcontract,
        labour_days: s.labour_days,
        labour_day_rate: s.labour_day_rate,
        subcontract_cost: s.subcontract_cost,
        material_cost_total: s.material_cost_total,
        margin_percentage: s.margin_percentage,
      })
    )

    const quoteTotals = calculateQuoteTotals({
      sections: sectionCalcs,
      vat_rate: input.vat_rate,
    })

    // Step 4: Insert quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        org_id,
        client_id: clientId,
        status: 'DRAFT',
        vat_rate: input.vat_rate,
        quote_amount_net: quoteTotals.quote_amount_net,
        quote_amount_gross: quoteTotals.quote_amount_gross,
        quote_total_cost: quoteTotals.quote_total_cost,
        quote_profit: quoteTotals.quote_profit,
        quote_margin_percentage: quoteTotals.quote_margin_percentage,
      })
      .select('id, client_id, status, quote_amount_net, quote_amount_gross, quote_total_cost, quote_profit, quote_margin_percentage')
      .single()

    if (quoteError || !quote) {
      return { success: false, error: `Failed to create quote: ${quoteError?.message}` }
    }

    // Step 5: Insert sections with calculated values
    for (let i = 0; i < input.sections.length; i++) {
      const s = input.sections[i]
      const calc = sectionCalcs[i]

      const { data: section, error: sectionError } = await supabase
        .from('quote_sections')
        .insert({
          quote_id: quote.id,
          org_id,
          title: s.title || `Section ${i + 1}`,
          trade_type: s.trade_type,
          sort_order: s.sort_order,
          is_subcontract: s.is_subcontract,
          labour_days: s.labour_days,
          labour_day_rate: s.labour_day_rate,
          subcontract_cost: s.subcontract_cost,
          material_cost_total: s.material_cost_total,
          margin_percentage: s.margin_percentage,
          labour_cost: calc.labour_cost,
          section_cost_total: calc.section_cost_total,
          section_revenue_total: calc.section_revenue_total,
          section_profit: calc.section_profit,
        })
        .select('id')
        .single()

      if (sectionError || !section) {
        return { success: false, error: `Failed to create section: ${sectionError?.message}` }
      }

      // Step 6: Create a line item per section (representing the section as a billable unit)
      const { error: lineError } = await supabase
        .from('quote_line_items')
        .insert({
          quote_id: quote.id,
          quote_section_id: section.id,
          org_id,
          description: s.title || `Section ${i + 1}`,
          quantity: 1,
          unit: 'item',
          unit_price_net: calc.section_revenue_total,
          line_total_net: calc.section_revenue_total,
          sort_order: s.sort_order,
        })

      if (lineError) {
        return { success: false, error: `Failed to create line item: ${lineError.message}` }
      }
    }

    revalidatePath('/quotes')
    revalidatePath(`/quotes/${quote.id}`)

    return { success: true, quoteId: quote.id, quote }
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown error' }
  }
}
