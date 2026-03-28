import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getJobsAction } from '@/lib/actions/jobs'
import Link from 'next/link'

export default async function JobsPage() {
  // Check authentication
  let supabase
  try {
    supabase = await createClient()
  } catch {
    redirect('/login?next=/jobs')
  }

  if (!supabase) {
    redirect('/login?next=/jobs')
  }

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login?next=/jobs')
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
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4" data-testid="jobs-error">
            <p className="text-red-700">Profile not found</p>
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
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4" data-testid="jobs-error">
            <p className="text-red-700">Organisation not assigned</p>
          </div>
        </div>
      </main>
    )
  }

  // Fetch jobs
  const result = await getJobsAction()

  if (!result.success) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4" data-testid="jobs-error">
            <p className="text-red-700">{result.error}</p>
          </div>
        </div>
      </main>
    )
  }

  const jobs = result.data || []

  return (
    <main className="min-h-screen bg-gray-50 p-6" data-testid="jobs-page">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
          <Link
            href="/quotes"
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
            data-testid="create-job-from-quote-link"
          >
            Create from Quote
          </Link>
        </header>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6" data-testid="jobs-info">
          <p className="text-yellow-800 text-sm">
            Jobs are created from accepted quotes. Go to Quotes to convert a quote into a job.
          </p>
        </div>

        {jobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center" data-testid="jobs-empty">
            <p className="text-gray-500 mb-4">No jobs yet</p>
            <Link
              href="/quotes"
              className="text-blue-600 hover:underline"
            >
              Create a job from a quote
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden" data-testid="jobs-list">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source Quote
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr key={job.id} data-testid={`job-row-${job.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-900 font-medium">{job.title}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-600">{job.client?.name || '—'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/quotes/${job.source_quote_id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {job.source_quote?.title || 'View Quote'}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="text-blue-600 hover:underline"
                        data-testid={`view-job-${job.id}`}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
