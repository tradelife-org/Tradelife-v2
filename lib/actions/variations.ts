'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface SmallWorksInput {
  jobId: string
  description: string
  minutes: number
}

/**
 * Logs time for "Can You Just" / Small Works.
 * Calculates cost based on policy and creates a Variation.
 */
export async function logSmallWorksAction(input: SmallWorksInput) {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 1. Fetch Policy
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()
  
  if (!profile) throw new Error('Profile not found')
  const orgId = profile.org_id

  const { data: policy, error: policyError } = await supabase
    .from('can_you_just_policies')
    .select('*')
    .eq('org_id', orgId)
    .single()

  // Use defaults if policy missing (migration lag safety)
  const ratePer15 = policy?.rate_per_15min ?? 1500
  const increment = policy?.min_increment ?? 15
  // const rounding = policy?.rounding_rule ?? 'UP' // Assume UP for now as per task

  // 2. Calculate
  // Rule: Round UP to nearest increment
  // e.g. 20 mins / 15 = 1.33 -> ceil -> 2 blocks.
  const blocks = Math.ceil(input.minutes / increment)
  const billedMinutes = blocks * increment
  
  // Cost = blocks * rate
  const cost = blocks * ratePer15
  
  // 3. Create Variation
  // Status: PROPOSED (Needs approval to hit ledger)
  const { error } = await supabase
    .from('variations')
    .insert({
      org_id: orgId,
      job_id: input.jobId,
      description: input.description || `Small Works: ${input.minutes} mins`,
      reason: 'Logged via Van Voice / Small Works',
      quantity: blocks, 
      unit: `${increment}m block`,
      unit_price_net: ratePer15,
      line_total_net: cost,
      status: 'PROPOSED'
    })

  if (error) {
    console.error('Variation log failed:', error)
    throw new Error('Failed to log small works')
  }

  revalidatePath(`/jobs/${input.jobId}`)
  return { success: true }
}

/**
 * Approves a Variation.
 * Triggers COMMITTED_REVENUE in Ledger.
 */
export async function approveVariationAction(variationId: string) {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 1. Fetch Variation
  const { data: variation, error: fetchError } = await supabase
    .from('variations')
    .select('*')
    .eq('id', variationId)
    .single()

  if (fetchError || !variation) throw new Error('Variation not found')
  if (variation.status === 'APPROVED') throw new Error('Already approved')

  // 2. Update Status -> APPROVED
  const { error: updateError } = await supabase
    .from('variations')
    .update({ 
      status: 'APPROVED', 
      approved_at: new Date().toISOString() 
    })
    .eq('id', variationId)

  if (updateError) throw new Error('Failed to approve variation')

  // 3. Ledger Entry (Committed Revenue)
  // "Upon 'Approval', the variation must trigger a COMMITTED_REVENUE entry"
  const { error: ledgerError } = await supabase
    .from('job_wallet_ledger')
    .insert({
        org_id: variation.org_id,
        job_id: variation.job_id,
        amount: variation.line_total_net,
        transaction_type: 'CREDIT',
        category: 'COMMITTED_REVENUE',
        description: `Variation Approved: ${variation.description}`
    })

  if (ledgerError) console.error('Ledger variation entry failed:', ledgerError)

  // 4. Create Job Line Item (Sync)
  // variations table has job_line_item_id FK.
  // Schema says: "job_line_items ... source_variation_id"
  // So we create a job_line_item and update variation with its ID?
  // Or just create it?
  // The schema audit said: "Lineage (populated on approval) ... job_line_item_id UUID"
  
  const { data: lineItem, error: lineError } = await supabase
    .from('job_line_items')
    .insert({
        job_id: variation.job_id,
        org_id: variation.org_id,
        description: variation.description,
        quantity: variation.quantity,
        unit: variation.unit,
        unit_price_net: variation.unit_price_net,
        line_total_net: variation.line_total_net,
        status: 'PENDING',
        is_variation: true,
        source_variation_id: variationId
    })
    .select()
    .single()

  if (lineItem) {
      await supabase
        .from('variations')
        .update({ job_line_item_id: lineItem.id })
        .eq('id', variationId)
  } else {
      console.error('Failed to create sync line item:', lineError)
  }

  revalidatePath(`/jobs/${variation.job_id}`)
  return { success: true }
}
