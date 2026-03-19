import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Update profiles table
    const { error: profileError } = await admin
      .from('profiles')
      .update({ onboarding_complete: true, onboarding_completed: true })
      .eq('id', session.user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
    }

    // Update user metadata
    const { error: metaError } = await admin.auth.admin.updateUserById(session.user.id, {
      user_metadata: { onboarding_completed: true },
    })

    if (metaError) {
      console.error('Metadata update error:', metaError)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Onboarding complete error:', err)
    return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 })
  }
}
