import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const body = await req.text()

  await supabase.from('webhook_logs').insert({
    source: 'stripe',
    payload: body,
  })

  return Response.json({ received: true })
}
