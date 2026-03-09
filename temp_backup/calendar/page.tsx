import { createServerSupabaseClient } from '@/lib/supabase/server'
import { GlassPanel } from '@/components/ui/glass-panel'
import VisitForm from '@/components/calendar/visit-form'
import VisitList from '@/components/calendar/visit-list' // We'll make this next
import { Plus } from 'lucide-react'

export default async function CalendarPage() {
  const supabase = await createServerSupabaseClient()
  
  // Fetch Visits
  const { data: visits } = await supabase
    .from('job_visits')
    .select(`
      *,
      jobs ( title, clients ( name ) ),
      visit_assignments ( 
        profiles ( full_name, email ) 
      )
    `)
    .order('start_time', { ascending: true })

  // Fetch Jobs (for form)
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, clients(name)')
    .neq('status', 'CANCELLED')
    .neq('status', 'COMPLETED') // Only active jobs

  // Fetch Staff (for form)
  // Assuming profiles in same org are staff
  const { data: staff } = await supabase
    .from('profiles')
    .select('id, full_name, email')

  return (
    <div className="container mx-auto px-4 py-8">
      <VisitList visits={visits || []} jobs={jobs || []} staff={staff || []} />
    </div>
  )
}
