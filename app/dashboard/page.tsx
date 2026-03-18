const supabase = getSupabaseServerClient()
import { getSupabaseServerClient } from @/lib/supabase/server-safe'

export default async function DashboardPage() {
  const supabase = getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Not authenticated</div>
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome to TradeLife</p>
    </div>
  )
}
