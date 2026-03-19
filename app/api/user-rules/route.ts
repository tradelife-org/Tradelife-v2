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
    const orgId = searchParams.get('org_id')

    if (!orgId) {
      return NextResponse.json({ rules: [] })
    }

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
    const { merchant, type, category, org_id } = body

    if (!merchant || !type || !category || !org_id) {
      return NextResponse.json({ error: 'merchant, type, category, org_id required' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Check if rule exists for this merchant + org
    const { data: existing } = await supabase
      .from('user_rules')
      .select('id')
      .eq('org_id', org_id)
      .eq('merchant', merchant.toLowerCase())
      .limit(1)

    if (existing && existing.length > 0) {
      // Update existing rule
      const { data, error } = await supabase
        .from('user_rules')
        .update({ type, category })
        .eq('id', existing[0].id)
        .select()
        .single()

      if (error) {
        console.error('Update user rule error:', error)
        return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 })
      }
      return NextResponse.json({ rule: data })
    } else {
      // Insert new rule
      const { data, error } = await supabase
        .from('user_rules')
        .insert({ merchant: merchant.toLowerCase(), type, category, org_id })
        .select()
        .single()

      if (error) {
        console.error('Insert user rule error:', error)
        return NextResponse.json({ error: 'Failed to save rule' }, { status: 500 })
      }
      return NextResponse.json({ rule: data })
    }
  } catch (err) {
    console.error('User rules POST error:', err)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
