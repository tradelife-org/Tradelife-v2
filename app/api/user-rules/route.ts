import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const orgId = searchParams.get('org_id') || 'default'

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('user_rules')
      .select('*')
      .eq('org_id', orgId)

    if (error) {
      console.error('Fetch user rules error:', error)
      return NextResponse.json({ rules: [] })
    }

    return NextResponse.json({ rules: data || [] })
  } catch (err) {
    console.error('User rules GET error:', err)
    return NextResponse.json({ rules: [] })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { merchant, type, category, org_id = 'default' } = body

    if (!merchant || !type || !category) {
      return NextResponse.json({ error: 'merchant, type, category required' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('user_rules')
      .upsert(
        { merchant: merchant.toLowerCase(), type, category, org_id },
        { onConflict: 'merchant,org_id' }
      )
      .select()

    if (error) {
      console.error('Upsert user rule error:', error)
      return NextResponse.json({ error: 'Failed to save rule' }, { status: 500 })
    }

    return NextResponse.json({ rule: data?.[0] })
  } catch (err) {
    console.error('User rules POST error:', err)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
