'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generateFlashJSON } from '@/lib/ai/gemini'
import { revalidatePath } from 'next/cache'

export interface ParsedQuote {
  clientName?: string
  description: string
  lineItems: { description: string; quantity: number; estimatedPrice: number }[]
}

// ... existing syncAccountingAction ...
export async function syncAccountingAction() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
  
  if (!profile) throw new Error('Profile not found')

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, invoice_line_items(*), clients(name)')
    .eq('org_id', profile.org_id)
    .limit(50)

  let detectedCount = 0

  for (const inv of invoices || []) {
    const text = inv.invoice_line_items.map((i: any) => i.description).join('\n')
    const keywords = ['Boiler', 'Worcester', 'EV Charger', 'EICR', 'Installation']
    
    if (keywords.some(k => text.includes(k))) {
      const prompt = `Analyze this invoice content to detect installed assets.
      Keywords: Boiler, EV Charger, EICR.
      Text: "${text}"
      Date: "${inv.issue_date}"
      Client: "${inv.clients?.name}"
      
      Return JSON: { 
        detected: boolean, 
        asset_type: string, 
        install_date: string (YYYY-MM-DD), 
        recommended_service_date: string (YYYY-MM-DD, +1 year from install)
      }`

      try {
        const analysis = await generateFlashJSON(prompt)
        
        if (analysis.detected) {
          const clientId = inv.source_job_id ? (await getClientIdFromJob(supabase, inv.source_job_id)) : null

          await supabase.from('maintenance_schedules').insert({
            org_id: profile.org_id,
            client_id: clientId,
            title: `Annual Service: ${analysis.asset_type}`,
            frequency: 'yearly',
            next_due_date: analysis.recommended_service_date,
            amount_net: 15000, 
            active: false,
            source_invoice_id: inv.id,
            import_status: 'PENDING_REVIEW'
          })
          detectedCount++
        }
      } catch (err) {
        console.error('AI Parse failed', err)
      }
    }
  }

  revalidatePath('/onboarding/import-review')
  return { detected: detectedCount }
}

async function getClientIdFromJob(supabase: any, jobId: string) {
  const { data } = await supabase.from('jobs').select('client_id').eq('id', jobId).single()
  return data?.client_id
}

export async function approveScheduleAction(scheduleId: string) {
  const supabase = await createServerSupabaseClient()
  await supabase
    .from('maintenance_schedules')
    .update({ active: true, import_status: 'ACTIVE' })
    .eq('id', scheduleId)
  revalidatePath('/onboarding/import-review')
}

export async function ignoreScheduleAction(scheduleId: string) {
  const supabase = await createServerSupabaseClient()
  await supabase
    .from('maintenance_schedules')
    .update({ active: false, import_status: 'IGNORED' })
    .eq('id', scheduleId)
  revalidatePath('/onboarding/import-review')
}

// --- NEW: Voice Intake Parsing ---
export async function parseQuoteRequestAction(input: string): Promise<ParsedQuote> {
  const prompt = `Analyze this job request and extract quote details.
  Input: "${input}"
  
  Return JSON: {
    clientName: string (if mentioned, else null),
    description: string (summary),
    lineItems: { description: string, quantity: number, estimatedPrice: number (pence) }[]
  }`

  return await generateFlashJSON<ParsedQuote>(prompt)
}
