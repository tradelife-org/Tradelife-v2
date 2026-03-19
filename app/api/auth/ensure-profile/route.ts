import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { user_id, email } = body

    if (!user_id) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if profile exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user_id)
      .single()

    if (existing) {
      return NextResponse.json({ profile: existing })
    }

    // Create profile
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: user_id,
        email: email || null,
        onboarding_complete: false,
        onboarding_completed: false,
        role: 'owner',
      })
      .select()
      .single()

    if (error) {
      console.error('Create profile error:', error)
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }

    return NextResponse.json({ profile: data })
  } catch (err) {
    console.error('Ensure profile error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
