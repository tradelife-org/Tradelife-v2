import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const body = await req.json().catch(() => ({}))
  const quoteId = body?.quoteId

  if (!quoteId) {
    return Response.json({ error: 'Missing quoteId' }, { status: 400 })
  }

  const { error } = await supabase
    .from('quotes')
    .update({ status: 'ACCEPTED' })
    .eq('id', quoteId)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
