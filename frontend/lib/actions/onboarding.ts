'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type OnboardingResult = {
  success: boolean
  error?: string
}

export async function completeOnboardingAction(formData: FormData): Promise<OnboardingResult> {
  const businessName = formData.get('business_name') as string
  const tradeType = formData.get('trade_type') as string

  if (!businessName || !tradeType) {
    return { success: false, error: 'Business name and trade type are required' }
  }

  const supabase = await createClient()

  if (!supabase) {
    return { success: false, error: 'Service unavailable' }
  }

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Fetch user profile to get org_id
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, org_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { success: false, error: 'Profile not found' }
  }

  const orgId = profile.org_id

  if (!orgId) {
    return { success: false, error: 'Organisation not found' }
  }

  // Update organisation name and trade_type
  const { error: orgUpdateError } = await supabase
    .from('organisations')
    .update({ 
      name: businessName,
      trade_type: tradeType
    })
    .eq('id', orgId)

  if (orgUpdateError) {
    return { success: false, error: 'Failed to update organisation' }
  }

  // Mark onboarding as completed
  const { error: profileUpdateError } = await supabase
    .from('profiles')
    .update({ onboarding_completed: true })
    .eq('id', user.id)

  if (profileUpdateError) {
    return { success: false, error: 'Failed to complete onboarding' }
  }

  redirect('/dashboard')
}

export async function checkOnboardingStatus(): Promise<{
  authenticated: boolean
  onboardingCompleted: boolean | null
}> {
  const supabase = await createClient()

  if (!supabase) {
    return { authenticated: false, onboardingCompleted: null }
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { authenticated: false, onboardingCompleted: null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()

  return {
    authenticated: true,
    onboardingCompleted: profile?.onboarding_completed ?? false
  }
}
