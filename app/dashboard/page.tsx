import { getSupabaseServerClient } from '@/lib/supabase/server-safe'

export default async function DashboardPage() {
  const supabase = getSupabaseServerClient()

  return (
    <div>
      <h1>Dashboard</h1>
      <p>TradeLife is live</p>
    </div>
  )
}
