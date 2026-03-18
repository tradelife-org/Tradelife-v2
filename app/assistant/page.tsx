import { getSupabaseServerClient } from '../../lib/supabase/server-safe'

export default async function AssistantPage() {
  const supabase = getSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return <div>Not authenticated</div>

  return (
    <div>
      <h1>Assistant</h1>
      <p>AI assistant coming online...</p>
    </div>
  )
}
