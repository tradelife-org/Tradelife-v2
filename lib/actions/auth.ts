'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * Ensures an org + profile exists for a newly signed-up user.
 * Called after supabase.auth.signUp() as a safety net.
 * If the DB trigger (handle_new_user) already ran, this is a no-op.
 */
export async function ensureOrgAndProfile(userId: string, email: string, fullName: string) {
  const supabase = createServiceRoleClient()

  // Check if profile already exists (trigger may have created it)
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()

  if (existing) return { success: true }

  // Create org
  const orgName = fullName ? `${fullName}'s Org` : `${email}'s Org`
  const { data: org, error: orgError } = await supabase
    .from('organisations')
    .insert({ name: orgName })
    .select('id')
    .single()

  if (orgError) return { success: false, error: orgError.message }

  // Create profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      org_id: org.id,
      full_name: fullName,
      email,
      role: 'owner',
    })

  if (profileError) return { success: false, error: profileError.message }

  return { success: true }
}
