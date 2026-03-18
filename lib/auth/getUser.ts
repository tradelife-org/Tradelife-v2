import { adminClient, createServerSupabaseClient } from "@/lib/supabase/server"

function getDefaultOrgName(user: any) {
  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name
  const email = user?.email || "user"

  if (fullName) {
    return `${fullName}'s Org`
  }

  return `${email}'s Org`
}

async function ensureOrgForUser(user: any) {
  const orgName = getDefaultOrgName(user)

  const { data: org, error } = await adminClient
    .from('organisations')
    .insert({ name: orgName })
    .select('id')
    .single()

  if (error || !org) {
    console.error('Failed to create organisation for user', error)
    return null
  }

  return org.id as string
}

export async function getUserWithOrg() {
  const user = await getUser()

  if (!user) {
    return { user: null, profile: null, org_id: null }
  }

  try {
    const { data: existingProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, org_id, active_org_id, full_name, email, role, onboarding_completed')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('Failed to fetch profile', profileError)
    }

    let orgId = existingProfile?.org_id || existingProfile?.active_org_id || null

    if (orgId) {
      const { data: organisation, error: organisationError } = await adminClient
        .from('organisations')
        .select('id')
        .eq('id', orgId)
        .maybeSingle()

      if (organisationError) {
        console.error('Failed to verify organisation', organisationError)
      }

      if (!organisation) {
        orgId = null
      }
    }

    if (!orgId) {
      orgId = await ensureOrgForUser(user)
    }

    if (!orgId) {
      return { user, profile: existingProfile || null, org_id: null }
    }

    const profilePayload = {
      id: user.id,
      org_id: orgId,
      active_org_id: orgId,
      full_name: existingProfile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || null,
      email: existingProfile?.email || user.email || null,
      role: existingProfile?.role || 'owner',
    }

    if (!existingProfile) {
      const { error: insertError } = await adminClient
        .from('profiles')
        .insert(profilePayload)

      if (insertError) {
        console.error('Failed to create missing profile', insertError)
      }
    } else {
      const updates: Record<string, string> = {}

      if (!existingProfile.org_id) {
        updates.org_id = orgId
      }

      if (!existingProfile.active_org_id) {
        updates.active_org_id = orgId
      }

      if (!existingProfile.email && user.email) {
        updates.email = user.email
      }

      const derivedName = user.user_metadata?.full_name || user.user_metadata?.name
      if (!existingProfile.full_name && derivedName) {
        updates.full_name = derivedName
      }

      if (!existingProfile.role) {
        updates.role = 'owner'
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await adminClient
          .from('profiles')
          .update(updates)
          .eq('id', user.id)

        if (updateError) {
          console.error('Failed to repair profile', updateError)
        }
      }
    }

    const { data: finalProfile, error: finalProfileError } = await adminClient
      .from('profiles')
      .select('id, org_id, active_org_id, full_name, email, role, onboarding_completed')
      .eq('id', user.id)
      .maybeSingle()

    if (finalProfileError) {
      console.error('Failed to fetch repaired profile', finalProfileError)
    }

    return {
      user,
      profile: finalProfile || existingProfile || null,
      org_id: finalProfile?.org_id || finalProfile?.active_org_id || orgId,
    }
  } catch (error) {
    console.error('Failed to ensure user org state', error)
    return { user, profile: null, org_id: null }
  }
}

export async function getUser() {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error('Failed to fetch authenticated user', error)
      return null
    }

    return user ?? null
  } catch (error) {
    console.error('Unexpected error while fetching authenticated user', error)
    return null
  }
}
