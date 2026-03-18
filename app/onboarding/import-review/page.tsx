import { createServerSupabaseClient } from '@/lib/supabase/server'
import ImportReview from '@/components/onboarding/import-review'
import AppShell from '@/components/app-shell'
import { redirect } from 'next/navigation'
import { getUserWithOrg } from '@/lib/auth/getUser'

export default async function ImportReviewPage() {
  const { user, org_id, profile } = await getUserWithOrg()

  if (!user) {
    redirect('/login')
  }

  if (!org_id) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto py-8">
          <p>Finish onboarding to review imported schedules.</p>
        </div>
      </AppShell>
    )
  }

  if (!profile?.onboarding_completed) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto py-8">
          <p>Finish onboarding to review imported schedules.</p>
        </div>
      </AppShell>
    )
  }

  const supabase = await createServerSupabaseClient()

  const { data: schedules, error } = await supabase
    .from('maintenance_schedules')
    .select('*')
    .eq('org_id', org_id)
    .eq('import_status', 'PENDING_REVIEW')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to load import review schedules', error)
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto py-8">
        <ImportReview schedules={schedules || []} />
      </div>
    </AppShell>
  )
}
