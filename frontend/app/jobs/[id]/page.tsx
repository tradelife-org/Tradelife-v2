import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getJobByIdAction } from '@/lib/actions/jobs'
import Link from 'next/link'

type Props = {
  params: Promise<{ id: string }>
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params

  // Check authentication
  let supabase
  try {
    supabase = await createClient()
  } catch {
    redirect(`/login?next=/jobs/${id}`)
  }

  if (!supabase) {
    redirect(`/login?next=/jobs/${id}`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect(`/login?next=/jobs/${id}`)
  }

  // Fetch profile for guards
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('org_id, onboarding_completed')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-lg mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4" data-testid="job-error">
            <p className="text-red-700">Profile not found</p>
          </div>
          <div className="mt-6">
            <Link href="/jobs" className="text-gray-600 hover:text-gray-900">
              ← Back to Jobs
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (!profile.onboarding_completed) {
    redirect('/onboarding')
  }

  if (!profile.org_id) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-lg mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4" data-testid="job-error">
            <p className="text-red-700">Organisation not assigned</p>
          </div>
          <div className="mt-6">
            <Link href="/jobs" className="text-gray-600 hover:text-gray-900">
              ← Back to Jobs
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // Fetch job
  const result = await getJobByIdAction(id)

  if (!result.success || !result.data) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-lg mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4" data-testid="job-error">
            <p className="text-red-700">{result.error || 'Job not found'}</p>
          </div>
          <div className="mt-6">
            <Link href="/jobs" className="text-gray-600 hover:text-gray-900">
              ← Back to Jobs
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const job = result.data

  return (
    <main className="min-h-screen bg-gray-50 p-6" data-testid="job-detail-page">
      <div className="max-w-lg mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="job-title">
            {job.title}
          </h1>
        </header>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h2>
          
          <dl className="space-y-4">
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <dt className="text-gray-600">Title</dt>
              <dd className="text-gray-900 font-medium" data-testid="job-detail-title">
                {job.title}
              </dd>
            </div>

            <div className="flex justify-between border-b border-gray-100 pb-3">
              <dt className="text-gray-600">Client</dt>
              <dd className="text-gray-900" data-testid="job-detail-client">
                {job.client?.name || '—'}
              </dd>
            </div>

            <div className="flex justify-between border-b border-gray-100 pb-3">
              <dt className="text-gray-600">Source Quote</dt>
              <dd data-testid="job-detail-quote">
                <Link
                  href={`/quotes/${job.source_quote_id}`}
                  className="text-blue-600 hover:underline"
                >
                  {job.source_quote?.title || 'View Quote'}
                </Link>
              </dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-gray-600">Created</dt>
              <dd className="text-gray-900" data-testid="job-detail-created">
                {new Date(job.created_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-6">
          <Link href="/jobs" className="text-gray-600 hover:text-gray-900">
            ← Back to Jobs
          </Link>
        </div>
      </div>
    </main>
  )
}
