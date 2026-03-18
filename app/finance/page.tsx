import { getSupabaseServerClient } from '@/lib/supabase/server-safe'

export default async function FinancePage() {
  const supabase = getSupabaseServerClient()

  const { data, error } = await supabase.from('invoices').select('*')

  if (error) return <div>Error loading finance</div>

  return (
    <div>
      <h1>Finance</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
