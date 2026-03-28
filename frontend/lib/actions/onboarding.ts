'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type OnboardingResult = {
  success: boolean
  error?: string
}

export async function completeOnboardingAction(formData: FormData): Promise<OnboardingResult> {
  const businessName = formData.get('business_name') as string | null
  const tradeType = formData.get('trade_type') as string | null

  // Validate required fields
  if (!businessName || typeof businessName !== 'string' || businessName.trim() === '') {
    return { success: false, error: 'Business name is required' }
  }

  if (!tradeType || typeof tradeType !== 'string' || tradeType.trim() === '') {
    return { success: false, error: 'Trade type is required' }
  }

  let supabase
  try {
    supabase = await createClient()
  } catch {
    return { success: false, error: 'Failed to initialize service' }
  }

  if (!supabase) {
    return { success: false, error: 'Service unavailable' }
  }

  // Get current user
  let user
  try {
    const { data, error: userError } = await supabase.auth.getUser()
    if (userError) {
      return { success: false, error: `Authentication failed: ${userError.message}` }
    }
    user = data?.user
  } catch {
    return { success: false, error: 'Failed to verify authentication' }
  }

  if (!user || !user.id) {
    return { success: false, error: 'Not authenticated' }
  }

  // Fetch user profile to get org_id
  let profile
  try {
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('id, org_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return { success: false, error: `Profile lookup failed: ${profileError.message}` }
    }
    profile = data
  } catch {
    return { success: false, error: 'Failed to fetch profile' }
  }

  // Null checks for profile
  if (!profile) {
    return { success: false, error: 'Profile not found' }
  }

  if (typeof profile.org_id === 'undefined') {
    return { success: false, error: 'Profile missing organisation reference' }
  }

  const orgId = profile.org_id

  if (!orgId) {
    return { success: false, error: 'Organisation not assigned to profile' }
  }

  // Update organisation name only (trade_type removed - schema not confirmed)
  try {
    const { error: orgUpdateError } = await supabase
      .from('organisations')
      .update({ name: businessName.trim() })
      .eq('id', orgId)

    if (orgUpdateError) {
      return { success: false, error: `Organisation update failed: ${orgUpdateError.message}` }
    }
  } catch {
    return { success: false, error: 'Failed to update organisation' }
  }

  // Mark onboarding as completed
  try {
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', user.id)

    if (profileUpdateError) {
      return { success: false, error: `Profile update failed: ${profileUpdateError.message}` }
    }
  } catch {
    return { success: false, error: 'Failed to complete onboarding' }
  }

  redirect('/dashboard')
}

export async function checkOnboardingStatus(): Promise<{
  authenticated: boolean
  onboardingCompleted: boolean | null
  error?: string
}> {
  let supabase
  try {
    supabase = await createClient()
  } catch {
    return { authenticated: false, onboardingCompleted: null, error: 'Failed to initialize service' }
  }

  if (!supabase) {
    return { authenticated: false, onboardingCompleted: null, error: 'Service unavailable' }
  }

  let user
  try {
    const { data, error: userError } = await supabase.auth.getUser()
    if (userError) {
      return { authenticated: false, onboardingCompleted: null, error: userError.message }
    }
    user = data?.user
  } catch {
    return { authenticated: false, onboardingCompleted: null, error: 'Failed to verify authentication' }
  }

  if (!user || !user.id) {
    return { authenticated: false, onboardingCompleted: null }
  }

  let profile
  try {
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return { authenticated: true, onboardingCompleted: null, error: profileError.message }
    }
    profile = data
  } catch {
    return { authenticated: true, onboardingCompleted: null, error: 'Failed to fetch profile' }
  }

  return {
    authenticated: true,
    onboardingCompleted: profile?.onboarding_completed ?? false
  }
}
