const supabase = getSupabaseServerClient()
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: any[]) {
          // ignore setAll in GET route handler
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 1. Fetch Profile
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // Create Profile if missing.
    // Create an org first because org_id is required in the profiles schema.
    const { data: newOrg, error: orgErr } = await supabase
      .from('organisations')
      .insert({ name: 'My Business' })
      .select()
      .single()

    if (orgErr || !newOrg) {
      return NextResponse.json({ error: 'Failed to create org' }, { status: 500 })
    }

    const { data: newProfile, error: profErr } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || 'User',
        org_id: newOrg.id,
        active_org_id: newOrg.id,
        onboarding_completed: false
      })
      .select()
      .single()
      
    if (profErr || !newProfile) {
       return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }

    profile = newProfile
  } else {
    // Profile exists, ensure active_org_id is set
    if (!profile.active_org_id) {
       let targetOrgId = profile.org_id
       if (!targetOrgId) {
          const { data: newOrg } = await supabase.from('organisations').insert({ name: 'My Business' }).select().single()
          targetOrgId = newOrg?.id
       }
       if (targetOrgId) {
         await supabase.from('profiles').update({ org_id: targetOrgId, active_org_id: targetOrgId }).eq('id', user.id)
         profile.active_org_id = targetOrgId
         profile.org_id = targetOrgId
       }
    }
  }

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    profile,
    organisation: { id: profile.active_org_id }
  })
}
