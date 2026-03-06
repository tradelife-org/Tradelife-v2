import { createServerSupabaseClient } from '@/lib/supabase/server'
import CreateInvoiceForm from '@/components/invoices/create-form'

export default async function CreateInvoicePage() {
  const supabase = createServerSupabaseClient()
  
  // Fetch Active Jobs (that can be invoiced)
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, status, clients(name)')
    .neq('status', 'CANCELLED') // Allow completed jobs to have final invoices
    .order('created_at', { ascending: false })

  return (
    <div className="container mx-auto px-4 py-12">
      <CreateInvoiceForm jobs={jobs || []} />
    </div>
  )
}
