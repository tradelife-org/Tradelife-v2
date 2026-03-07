'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

interface TemplateInput {
  name: string
  trade_type: string
  is_subcontract: boolean
  labour_days: number
  labour_day_rate: number
  subcontract_cost: number
  material_cost_total: number
  margin_percentage: number
}

export async function saveTemplate(input: TemplateInput) {
  const supabase = createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile) return { success: false, error: 'Profile not found' }

  const { data, error } = await supabase
    .from('quote_templates')
    .insert({
      org_id: profile.org_id,
      name: input.name,
      trade_type: input.trade_type,
      is_subcontract: input.is_subcontract,
      labour_days: input.labour_days,
      labour_day_rate: input.labour_day_rate,
      subcontract_cost: input.subcontract_cost,
      material_cost_total: input.material_cost_total,
      margin_percentage: input.margin_percentage,
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, templateId: data.id }
}

export async function getTemplates() {
  try {
    const supabase = createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!profile) return []

    const { data, error } = await supabase
      .from('quote_templates')
      .select('*')
      .eq('org_id', profile.org_id)
      .order('created_at', { ascending: false })

    if (error) return [] // Table may not exist yet
    return data ?? []
  } catch {
    return []
  }
}

export async function deleteTemplate(templateId: string) {
  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('quote_templates')
    .delete()
    .eq('id', templateId)

  return { success: !error, error: error?.message }
}
