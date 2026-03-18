const supabase = getSupabaseServerClient()
import { getSupabaseServerClient } from @/lib/supabase/server-safe'

export default async function ClientsPage() {
  const supabase = getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Not authenticated</div>
  }

  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')

  if (error) {
    return <div>Error loading clients</div>
  }

  return (
    <div>
      <h1>Clients</h1>
      <pre>{JSON.stringify(clients, null, 2)}</pre>
    </div>
  )
}
