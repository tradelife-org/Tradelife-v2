'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export async function syncDirectorsAction(companyNumber: string) {
  const supabase = createServerSupabaseClient()

  // 1. Auth & Context
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')
  const orgId = profile.org_id

  try {
    // 2. Fetch Officers from our API Bridge
    // We use an absolute URL if needed, but since it's a server action calling its own API,
    // it's better to fetch from the API route directly or use a shared lib.
    // For simplicity, we'll fetch via the API route.
    const officersRes = await fetch(`${BASE_URL}/api/companies-house?type=officers&companyNumber=${companyNumber}`)
    if (!officersRes.ok) throw new Error('Failed to fetch officers')
    const officersData = await officersRes.json()

    // 3. Fetch PSC from our API Bridge
    const pscRes = await fetch(`${BASE_URL}/api/companies-house?type=psc&companyNumber=${companyNumber}`)
    if (!pscRes.ok) throw new Error('Failed to fetch PSC')
    const pscData = await pscRes.json()

    const membersToInsert: any[] = []

    // 4. Process Officers
    if (officersData.items) {
      for (const officer of officersData.items) {
        // Only include active directors
        if (officer.officer_role === 'director' && !officer.resigned_on) {
          membersToInsert.push({
            org_id: orgId,
            full_name: officer.name,
            role: 'Director',
            is_director: true,
            ch_officer_id: officer.links?.self?.split('/').pop(),
            idv_status: true // Mocking 2026 IDV status as true for official directors
          })
        }
      }
    }

    // 5. Insert into team_members (upsert based on name + org_id? No, we just insert for now)
    // To avoid duplicates, we could check ch_officer_id
    if (membersToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('team_members')
        .upsert(membersToInsert, { onConflict: 'org_id, ch_officer_id' }) // Requires unique constraint

      if (insertError) {
        console.error('Insert team members error:', insertError)
        // Fallback: simple insert if upsert fails due to missing constraint
        await supabase.from('team_members').insert(membersToInsert)
      }
    }

    revalidatePath('/settings/team')
    return { success: true, count: membersToInsert.length }

  } catch (err: any) {
    console.error('Sync directors error:', err)
    throw err
  }
}
