'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { xeroClient } from '@/lib/xero'
import { generateFlashJSON } from '@/lib/ai/gemini'
import { revalidatePath } from 'next/cache'

// ... existing auth functions ...

export async function getXeroAuthUrl() {
  const consentUrl = await xeroClient.buildConsentUrl()
  return { url: consentUrl }
}

export async function handleXeroCallback(url: string) {
  const supabase = await createServerSupabaseClient()
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
  const supabase = await createServerSupabaseClient()
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
    token_type: 'Bearer' 
  })

  const invoices = await xeroClient.accountingApi.getInvoices(conn.tenant_id, undefined, 'Type=="ACCREC"')
  
  let detected = 0
  
  for (const inv of invoices.body.invoices || []) {
    // 1. Backfill JOB (if missing)
    // Use Invoice Number as key
    const jobTitle = `Historical: ${inv.reference || inv.invoiceNumber}`
    
    // Check if job exists (simplified check)
    const { data: existingJob } = await supabase
      .from('jobs')
      .select('id')
      .eq('title', jobTitle)
      .eq('org_id', profile.org_id)
      .single()

    let jobId = existingJob?.id

    if (!existingJob) {
      // Create Historical Job
      const { data: newJob } = await supabase.from('jobs').insert({
        org_id: profile.org_id,
        title: jobTitle,
        status: 'COMPLETED', // Historical
        client_id: null, // Could map Contact to Client if we wanted
        target_start_date: inv.date,
        target_end_date: inv.dueDate
      }).select('id').single()
      
      jobId = newJob?.id
    }

    // 2. Detect Assets (Maintenance)
    const text = inv.lineItems?.map(l => l.description).join('\n') || ''
    const keywords = ['Boiler', 'Worcester', 'EV Charger', 'Installation']
    
    if (keywords.some(k => text.includes(k))) {
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
             client_id: null, // We skipped client mapping for speed, but job_id link helps
             title: `Imported Service: ${analysis.asset_type}`,
             frequency: 'yearly',
             next_due_date: analysis.install_date, 
             import_status: 'PENDING_REVIEW',
             // Link to the job we just found/created? Schema doesn't have job_id on schedule, uses client_id.
             // But we have source_invoice_id (Phase 22). 
             // We don't have the invoice in our DB (it's in Xero).
             // We can skip linking for now or create a placeholder invoice record.
           })
           detected++
        }
      } catch (e) {
        console.error(e)
      }
    }
  }
  
  revalidatePath('/jobs')
  revalidatePath('/onboarding/import-review')
  return { detected }
}
