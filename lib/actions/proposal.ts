'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

export async function acceptQuoteAction(
  token: string, 
  quoteId: string, 
  acceptedUpsellIds: string[],
  signatureData?: string
) {
  // Use Admin Client to bypass RLS (Public user accepting via token)
  const { createClient } = await import('@supabase/supabase-js')
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Verify Portal Token
  const { data: invite } = await adminClient
    .from('portal_invites')
    .select('client_id, org_id')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invite) throw new Error('Invalid or expired token')

  // 2. Fetch Full Quote Data for Snapshot
  const { data: quote } = await adminClient
    .from('quotes')
    .select(`
      *,
      quote_sections ( *, quote_line_items (*) ),
      quote_upsells (*)
    `)
    .eq('id', quoteId)
    .eq('org_id', invite.org_id)
    .single()

  if (!quote) throw new Error('Quote not found')
  if (quote.status === 'ACCEPTED') throw new Error('Quote already accepted')

  // 3. Update Upsells Selection
  if (quote.quote_upsells && quote.quote_upsells.length > 0) {
    const upsellUpdates = quote.quote_upsells.map((u: any) => ({
      id: u.id,
      accepted: acceptedUpsellIds.includes(u.id)
    }))
    
    for (const update of upsellUpdates) {
      await adminClient
        .from('quote_upsells')
        .update({ accepted: update.accepted })
        .eq('id', update.id)
    }
  }

  // 4. Calculate Final Total
  let finalGross = quote.quote_amount_gross
  const upsells = quote.quote_upsells || []
  const selectedUpsells = upsells.filter((u: any) => acceptedUpsellIds.includes(u.id))
  
  const vatRate = quote.vat_rate || 2000 // 20%
  const upsellTotalNet = selectedUpsells.reduce((sum: number, u: any) => sum + u.price_total, 0)
  const upsellTax = Math.round((upsellTotalNet * vatRate) / 10000)
  const upsellTotalGross = upsellTotalNet + upsellTax
  
  const totalAgreedGross = finalGross + upsellTotalGross

  // 5. Create Snapshot
  const snapshotData = {
    ...quote,
    final_upsells: selectedUpsells,
    final_calculations: {
      base_gross: finalGross,
      upsell_gross: upsellTotalGross,
      total_gross: totalAgreedGross
    }
  }

  const { data: snapshot, error: snapError } = await adminClient
    .from('quote_snapshots')
    .insert({
      org_id: invite.org_id,
      quote_id: quote.id,
      snapshot_data: snapshotData,
      total_amount_gross: totalAgreedGross,
      accepted_ip: headers().get('x-forwarded-for') || 'unknown',
      accepted_by_name: 'Client via Portal',
      signature_url: signatureData
    })
    .select('id')
    .single()

  if (snapError) throw new Error(`Snapshot failed: ${snapError.message}`)

  // 6. Update Quote Status
  const { error: updateError } = await adminClient
    .from('quotes')
    .update({ 
      status: 'ACCEPTED', 
      accepted_snapshot_id: snapshot.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', quoteId)

  if (updateError) throw new Error(`Status update failed: ${updateError.message}`)

  // ==========================================================================
  // PHASE 6: AUTOMATIC JOB CREATION
  // ==========================================================================
  
  // 7. Create Job Record
  // We use adminClient to ensure we have permissions even if public user context
  const { data: job, error: jobError } = await adminClient
    .from('jobs')
    .insert({
      org_id: quote.org_id,
      source_quote_id: quote.id,
      client_id: quote.client_id,
      title: quote.reference || `Job from Quote ${quote.id.slice(0, 8)}`,
      status: 'BOOKED', 
      target_start_date: null
    })
    .select()
    .single()

  if (jobError || !job) {
    console.error('Failed to auto-create job:', jobError)
    // We don't throw here to avoid rolling back acceptance, but log it.
  } else {
    // 8. Link Quote to Job
    await adminClient.from('quotes').update({ job_id: job.id }).eq('id', quoteId)

    // 9. Create Job Line Items (from Quote Lines)
    // Flatten all lines from all sections
    const allLines: any[] = []
    quote.quote_sections?.forEach((section: any) => {
      if (section.quote_line_items) {
        allLines.push(...section.quote_line_items)
      }
    })

    if (allLines.length > 0) {
      const jobLines = allLines.map((item: any) => ({
        job_id: job.id,
        org_id: quote.org_id,
        source_quote_line_id: item.id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price_net: item.unit_price_net,
        line_total_net: item.line_total_net,
        status: 'PENDING',
        sort_order: item.sort_order || 0
      }))
      await adminClient.from('job_line_items').insert(jobLines)
    }

    // 10. Populate Job Materials (Phase 6 Task 3)
    // Filter lines that look like materials? Or just add all as requirements?
    // "Populate the materials_required table by extracting all line items from the quote_snapshot categorized as 'materials'"
    // Our schema doesn't strictly categorize 'materials' vs 'labour' at line item level, 
    // BUT sections have `material_cost_total`.
    // However, `quote_line_items` are generic.
    // Heuristic: If it has unit cost > 0 and unit != 'hour'/'day', assume material?
    // Or just create generic requirements for now.
    // Let's create `job_materials` for every line item that isn't clearly labour.
    
    // Better approach: If we had a 'type' column on line items. We don't.
    // Let's add all items to job_materials but mark status as REQUIRED.
    // Excluding items with 'labour' or 'labor' in description or unit 'day'/'hour'.
    
    const materialLines = allLines.filter((l: any) => {
      const desc = l.description.toLowerCase()
      const unit = l.unit?.toLowerCase() || ''
      const isLabour = desc.includes('labour') || desc.includes('install') || unit.includes('day') || unit.includes('hour')
      return !isLabour
    })

    if (materialLines.length > 0) {
      const materials = materialLines.map((l: any) => ({
        org_id: quote.org_id,
        job_id: job.id,
        description: l.description,
        quantity: l.quantity,
        unit: l.unit,
        estimated_cost: l.unit_cost || 0, // Using the new unit_cost from Phase 4
        status: 'REQUIRED'
      }))
      await adminClient.from('job_materials').insert(materials)
    }

    // 11. Initialize Timeline
    await adminClient.from('job_timeline').insert({
      org_id: quote.org_id,
      job_id: job.id,
      title: 'Job Created',
      description: `Job automatically created from accepted quote ${quote.reference || quoteId}`,
      event_type: 'MILESTONE'
    })
  }

  // 12. Revalidate
  revalidatePath(`/p/${token}`)
  
  return { success: true, snapshotId: snapshot.id, jobId: job?.id }
}
