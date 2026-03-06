import { createServerSupabaseClient } from '@/lib/supabase/server'
import ImportReview from '@/components/onboarding/import-review'
import { AppShell } from '@/components/app-shell'

export default async function ImportReviewPage() {
  const supabase = createServerSupabaseClient()
  
  // Fetch Pending Reviews
  const { data: schedules } = await supabase
    .from('maintenance_schedules')
    .select('*')
    .eq('import_status', 'PENDING_REVIEW')
    .order('created_at', { ascending: false })

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto py-8">
        <ImportReview schedules={schedules || []} />
      </div>
    </AppShell>
  )
}
