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

  // Fetch jobs with client names, matching jobs/page.tsx logic
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*, clients(name)')
    .order('created_at', { ascending: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(jobs)
}
