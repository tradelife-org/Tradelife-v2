import { createServerSupabaseClient } from '@/lib/supabase/server'
import ReceiptIngest from '@/components/finance/receipt-ingest'

export default async function ReceiptsPage() {
  const supabase = await createServerSupabaseClient()
  
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, clients(name)')
    .neq('status', 'CANCELLED')
    .order('created_at', { ascending: false })

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <h1 className="text-2xl font-heading font-bold text-slate-900 mb-6">Scan Receipt</h1>
      <ReceiptIngest jobs={jobs || []} />
    </div>
  )
}
