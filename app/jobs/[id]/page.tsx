import { getSupabaseServerClient } from '@/lib/supabase/server-safe'

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const supabase = getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Not authenticated</div>
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error) {
    return <div>Error loading job</div>
  }

  return (
    <div>
      <h1>Job Detail</h1>
      <pre>{JSON.stringify(job, null, 2)}</pre>
    </div>
  )
}
