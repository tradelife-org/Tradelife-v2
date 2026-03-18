import { getSupabaseServerClient } from '@/lib/supabase/server-safe'

export default async function AssistantPage() {
  const supabase = getSupabaseServerClient()

  return (
    <div>
      <h1>Assistant</h1>
    </div>
  )
}
