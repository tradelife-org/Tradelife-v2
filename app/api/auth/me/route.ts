import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
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

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    if (!session?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      )
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    let org_id = profile?.org_id || profile?.active_org_id || null

    if (!org_id) {
      const { data: org } = await admin
        .from('organisations')
        .select('id')
        .limit(1)
        .single()
      org_id = org?.id || null
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        org_id,
        onboarding_complete: profile?.onboarding_complete || false,
      },
    })
  } catch (err) {
    console.error('Auth check error:', err)
    return NextResponse.json({ user: null }, { status: 500 })
  }
}
