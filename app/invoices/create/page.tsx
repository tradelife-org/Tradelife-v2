const supabase = getSupabaseServerClient()
import { createServerSupabaseClient } from '@/lib/supabase/server'
import CreateInvoiceForm from '@/components/invoices/create-form'
import { Suspense } from 'react'

export default async function CreateInvoicePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
  
  // Fetch Active Jobs (that can be invoiced)
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, status, clients(name)')
    .eq('org_id', profile?.org_id)
    .neq('status', 'CANCELLED') // Allow completed jobs to have final invoices
    .order('created_at', { ascending: false })

  return (
    <div className="container mx-auto px-4 py-12">
      <Suspense fallback={<div>Loading...</div>}>
        <CreateInvoiceForm jobs={jobs || []} />
      </Suspense>
    </div>
  )
}
