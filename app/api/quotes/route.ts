import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  // Get org_id from profile (pattern from quotes/page.tsx)
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return Response.json({ error: "Profile not found" }, { status: 404 })
  }

  const { data: quotes, error } = await supabase
    .from('quotes')
    .select(`
      id, status, reference,
      quote_amount_net, quote_amount_gross, quote_total_cost,
      quote_profit, quote_margin_percentage,
      created_at,
      clients ( name )
    `)
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  // Map to match the structure expected by the frontend if needed,
  // but usually API returns raw data and frontend maps it.
  // The quotes/page.tsx did some mapping. I'll return raw data here
  // and let the frontend handle it (or the testing agent verify it).
  
  return Response.json(quotes)
}
