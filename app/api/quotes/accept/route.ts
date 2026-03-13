import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { share_token } = await request.json()

    if (!share_token) {
      return NextResponse.json({ success: false, error: 'Missing share_token' }, { status: 400 })
    }

    // Use service role to bypass RLS — this is a public system action
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify quote exists and is in SENT status
    const { data: quote, error: fetchError } = await supabase
      .from('quotes')
      .select('id, status')
      .eq('share_token', share_token)
      .single()

    if (fetchError || !quote) {
      return NextResponse.json({ success: false, error: 'Quote not found' }, { status: 404 })
    }

    if (quote.status === 'ACCEPTED') {
      return NextResponse.json({ success: true }) // Idempotent
    }

    if (quote.status !== 'SENT') {
      return NextResponse.json(
        { success: false, error: 'This quote cannot be accepted in its current state' },
        { status: 400 }
      )
    }

    // Update to ACCEPTED
    const { error: updateError } = await supabase
      .from('quotes')
      .update({ status: 'ACCEPTED' })
      .eq('id', quote.id)

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
