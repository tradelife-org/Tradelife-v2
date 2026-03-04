'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function requestJobPayoutAction(jobId: string, amountPence: number) {
  const supabase = createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()
  
  if (!profile) throw new Error('Profile not found')

  // Use RPC
  const { error } = await supabase.rpc('record_payout_transaction', {
    p_org_id: profile.org_id,
    p_job_id: jobId,
    p_total_amount: amountPence,
    p_description: 'Payout Request'
  })

  if (error) {
    console.error('Payout failed:', error)
    
    // Fallback if RPC missing
    if (error.code === '42883') {
        console.warn('RPC missing, falling back to manual insert')
        const payout = Math.floor(amountPence * 0.75)
        const retention = amountPence - payout
        
        await supabase.from('job_wallet_ledger').insert([
            {
                org_id: profile.org_id, job_id: jobId, amount: payout,
                transaction_type: 'DEBIT', category: 'PAYOUT', description: 'Payout Request (75% Payout)'
            },
            {
                org_id: profile.org_id, job_id: jobId, amount: retention,
                transaction_type: 'DEBIT', category: 'RETENTION_HELD', description: 'Payout Request (25% Retention)'
            }
        ])
    } else {
        throw new Error('Failed to process payout')
    }
  }

  revalidatePath(`/jobs/${jobId}`)
  return { success: true }
}
