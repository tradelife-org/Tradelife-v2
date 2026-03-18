import { getSupabaseServerClient } from '@/lib/supabase/server-safe'

export default async function InvoicesPage() {
  const supabase = getSupabaseServerClient()

  const { data, error } = await supabase.from('invoices').select('*')

  if (error) return <div>Error loading invoices</div>

  return (
    <div>
      <h1>Invoices</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
