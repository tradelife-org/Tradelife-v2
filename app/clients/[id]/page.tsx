const supabase = getSupabaseServerClient()
import { getSupabaseServerClient } from '../../../lib/supabase/server-safe'

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const supabase = getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Not authenticated</div>
  }

  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error) {
    return <div>Error loading client</div>
  }

  return (
    <div>
      <h1>Client Detail</h1>
      <pre>{JSON.stringify(client, null, 2)}</pre>
    </div>
  )
}
