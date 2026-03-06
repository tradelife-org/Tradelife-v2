'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { xeroClient } from '@/lib/xero'
import { generateFlashJSON } from '@/lib/ai/gemini'
import { revalidatePath } from 'next/cache'

export async function getXeroAuthUrl() {
  const consentUrl = await xeroClient.buildConsentUrl()
  return { url: consentUrl }
}

export async function handleXeroCallback(url: string) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) throw new Error('Profile not found')

  const tokenSet = await xeroClient.apiCallback(url)
  await xeroClient.updateTenants(false)
  const tenantId = xeroClient.tenants[0].tenantId

  await supabase.from('accounting_connections').insert({
    org_id: profile.org_id,
    access_token: tokenSet.access_token,
    refresh_token: tokenSet.refresh_token,
    tenant_id: tenantId,
    expires_at: new Date(Date.now() + (tokenSet.expires_in || 3600) * 1000).toISOString()
  })

  return { success: true }
}

export async function syncXeroInvoicesAction() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) throw new Error('Profile not found')

  const { data: conn } = await supabase
    .from('accounting_connections')
    .select('*')
    .eq('org_id', profile.org_id)
    .single()

  if (!conn) throw new Error('No Xero connection')

  xeroClient.setTokenSet({
    access_token: conn.access_token,
    refresh_token: conn.refresh_token,
    token_type: 'Bearer' // assumption
  })

  // Refresh if needed (simplified check)
  // Standard Xero flow requires robust token management.
  // For MVP we assume token is valid or we'd fail.

  const invoices = await xeroClient.accountingApi.getInvoices(conn.tenant_id, undefined, 'Type=="ACCREC"')
  
  let detected = 0
  
  for (const inv of invoices.body.invoices || []) {
    // Detect Installation
    const text = inv.lineItems?.map(l => l.description).join('\n') || ''
    const keywords = ['Boiler', 'Worcester', 'EV Charger', 'Installation']
    
    if (keywords.some(k => text.includes(k))) {
      // AI Parse
      const prompt = `Analyze Xero Invoice:
      Text: "${text}"
      Date: "${inv.date}"
      Contact: "${inv.contact?.name}"
      
      Return JSON: { detected: boolean, asset_type: string, install_date: string }`
      
      try {
        const analysis = await generateFlashJSON(prompt)
        if (analysis.detected) {
           await supabase.from('maintenance_schedules').insert({
             org_id: profile.org_id,
             title: `Imported Service: ${analysis.asset_type}`,
             frequency: 'yearly',
             next_due_date: analysis.install_date, // Should be +1 year logic
             import_status: 'PENDING_REVIEW'
           })
           detected++
        }
      } catch (e) {
        console.error(e)
      }
    }
  }
  
  return { detected }
}
