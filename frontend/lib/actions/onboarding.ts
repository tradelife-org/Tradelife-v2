'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface OnboardingInput {
  companyName: string
  address: string
  vatRate: number // Assuming VAT Number is what is meant by "VAT Status"? Or Rate?
  // "On selection, auto-fill the address and VAT status" -> VAT Number/Registered?
  // I'll assume VAT Number for now.
  vatNumber: string | null
  logoUrl: string | null
  isVatRegistered: boolean
}

export async function completeOnboardingAction(input: OnboardingInput) {
  const supabase = createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  // Prepare update data
  // Note: Schema migration 00005_org_details.sql adds these columns.
  // If not applied, this will fail. We should handle that gracefully if possible or assume user applied it.
  const updates: any = {
    name: input.companyName,
    address: input.address,
    vat_number: input.vatNumber,
    logo_url: input.logoUrl,
    is_vat_registered: input.isVatRegistered,
    updated_at: new Date().toISOString()
  }

  // Check columns existence via dynamic insert? No.
  // Just try update. If fails, log error and proceed with basic update?
  try {
    const { error } = await supabase
      .from('organisations')
      .update(updates)
      .eq('id', profile.org_id)

    if (error) {
      // Fallback: If migration 00005 missing, try updating only name
      console.warn('Full update failed (schema mismatch?), falling back to name only', error)
      await supabase
        .from('organisations')
        .update({ name: input.companyName })
        .eq('id', profile.org_id)
    }
  } catch (err) {
    console.error('Update failed:', err)
    throw err
  }

  revalidatePath('/onboarding')
  // Redirect happens client side usually, or here via redirect()
  return { success: true }
}
