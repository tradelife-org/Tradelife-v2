import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Calendar } from 'lucide-react'

const statusColor: Record<string, string> = {
  ENQUIRY: 'bg-slate-100 text-slate-600',
  BOOKED: 'bg-blue-100 text-blue-700',
  ON_SITE: 'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  SIGNED_OFF: 'bg-emerald-100 text-emerald-700',
  SNAGGING: 'bg-orange-100 text-orange-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

export default async function JobsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, title, status, target_start_date, target_end_date, clients(name)')
    .eq('org_id', profile?.org_id)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4" data-testid="jobs-error">
        <p className="text-red-600 text-sm">Failed to load jobs</p>
      </div>
    )
  }

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4" data-testid="jobs-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900" data-testid="jobs-heading">Jobs</h1>
        <Link
          href="/jobs/create"
          data-testid="create-job-button"
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          New Job
        </Link>
      </div>

      {!jobs || jobs.length === 0 ? (
        <p className="text-gray-500 text-sm" data-testid="no-jobs-message">No jobs yet</p>
      ) : (
        <div className="space-y-2" data-testid="jobs-list">
          {jobs.map((job: any) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              data-testid={`job-row-${job.id}`}
              className="flex items-center justify-between p-4 rounded-lg bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{job.title}</p>
                  <p className="text-xs text-gray-500">{(job as any).clients?.name || 'No client'}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor[job.status] || 'bg-slate-100 text-slate-500'}`}>
                  {job.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {job.target_start_date && (
                  <span className="flex items-center gap-1" data-testid={`job-start-${job.id}`}>
                    <Calendar className="w-3 h-3" />
                    {fmtDate(job.target_start_date)}
                  </span>
                )}
                {job.target_end_date && (
                  <span className="text-gray-400" data-testid={`job-end-${job.id}`}>
                    — {fmtDate(job.target_end_date)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
