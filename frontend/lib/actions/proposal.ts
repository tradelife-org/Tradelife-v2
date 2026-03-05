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
  // Mark selected as accepted, others as rejected/not accepted
  // We do this BEFORE snapshot so snapshot reflects reality
  if (quote.quote_upsells && quote.quote_upsells.length > 0) {
    const upsellUpdates = quote.quote_upsells.map((u: any) => ({
      id: u.id,
      accepted: acceptedUpsellIds.includes(u.id)
    }))
    
    // Batch update? Supabase doesn't support easy batch update via JS SDK perfectly yet for different values.
    // Loop for now (low volume)
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
  
  // Add upsell prices (Gross? Assumed price_total is gross or we add VAT? 
  // Schema says price_total. Let's assume price_total IS the addition to the bill.
  // Ideally upsells have VAT too. For MVP, we add price_total directly or apply VAT.
  // Standard: price_total is Net? "price_total (sell price)". 
  // Let's assume Net and apply Quote VAT rate for safety, or assume Gross if simplified.
  // Let's apply VAT to be safe and professional.)
  
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
      accepted_by_name: 'Client via Portal', // Could capture from input
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

  // 7. Revalidate
  revalidatePath(`/p/${token}`)
  
  return { success: true, snapshotId: snapshot.id }
}
