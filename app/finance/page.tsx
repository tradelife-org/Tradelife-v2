const supabase = getSupabaseServerClient()
import { getSupabaseServerClient } from @/lib/supabase/server-safe'

export default async function FinancePage() {
  const supabase = getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Not authenticated</div>
  }

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*')

  if (error) {
    return <div>Error loading finance data</div>
  }

  return (
    <div>
      <h1>Finance</h1>
      <pre>{JSON.stringify(invoices, null, 2)}</pre>
    </div>
  )
}
