import { createServerSupabaseClient } from '@/lib/supabase/server'
import { GlassPanel } from '@/components/ui/glass-panel'
import Link from 'next/link'
import { Calendar } from 'lucide-react'
import XeroSyncButton from '@/components/jobs/xero-sync-button'

export default async function JobsDashboard() {
  const hasSupabaseEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  if (!hasSupabaseEnv) {
    return (
      <section className="mx-auto max-w-5xl space-y-6" data-testid="jobs-page">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.28em] text-neutral-500" data-testid="jobs-page-kicker">Operations</p>
            <h1 className="text-3xl font-semibold text-white" data-testid="jobs-page-title">Jobs</h1>
            <p className="text-sm text-neutral-400" data-testid="jobs-page-description">Track upcoming work, live jobs, and handovers from one board.</p>
          </div>

          <Link href="/jobs/create" className="inline-flex items-center justify-center rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700" data-testid="create-job-button">
            New Job
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" data-testid="jobs-fallback-grid">
          {['Planned', 'Live', 'Blocked', 'Complete'].map(column => (
            <div key={column} className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5" data-testid={`jobs-column-${column.toLowerCase()}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-neutral-400">{column}</h2>
                <span className="rounded-full border border-neutral-700 bg-neutral-800 px-2.5 py-1 text-xs text-neutral-300">0</span>
              </div>
              <p className="mt-8 text-sm text-neutral-500">No jobs yet</p>
            </div>
          ))}
        </div>
      </section>
    )
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
  const { data: jobs } = await supabase.from('jobs').select('*, clients(name)').eq('org_id', profile?.org_id).order('created_at', { ascending: false })

  const columns = {
    PLANNED: jobs?.filter(job => ['ENQUIRY', 'BOOKED'].includes(job.status)) || [],
    LIVE: jobs?.filter(job => ['ON_SITE', 'IN_PROGRESS'].includes(job.status)) || [],
    BLOCKED: jobs?.filter(job => ['SNAGGING', 'PAUSED'].includes(job.status)) || [],
    COMPLETE: jobs?.filter(job => ['COMPLETED', 'SIGNED_OFF', 'CANCELLED'].includes(job.status)) || [],
  }

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-0 py-2" data-testid="jobs-page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-neutral-500" data-testid="jobs-page-kicker">Operations</p>
          <h1 className="text-3xl font-semibold text-white" data-testid="jobs-page-title">Jobs</h1>
          <p className="text-sm text-neutral-400" data-testid="jobs-page-description">Keep planned, live, blocked, and complete work in one clear board.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <XeroSyncButton />
          <Link href="/jobs/create" className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700" data-testid="create-job-button">
            New Job
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4" data-testid="jobs-kanban-grid">
        <KanbanColumn title="Planned" jobs={columns.PLANNED} tone="border-neutral-800 bg-neutral-900/70" />
        <KanbanColumn title="Live" jobs={columns.LIVE} tone="border-blue-500/20 bg-blue-500/10" />
        <KanbanColumn title="Blocked" jobs={columns.BLOCKED} tone="border-amber-500/20 bg-amber-500/10" />
        <KanbanColumn title="Complete" jobs={columns.COMPLETE} tone="border-emerald-500/20 bg-emerald-500/10" />
      </div>
    </section>
  )
}

function KanbanColumn({ title, jobs, tone }: { title: string; jobs: any[]; tone: string }) {
  return (
    <div className={`flex min-h-[420px] flex-col rounded-2xl border p-4 ${tone}`} data-testid={`jobs-column-${title.toLowerCase()}`}>
      <div className="mb-4 flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-400">{title}</h2>
        <span className="rounded-full border border-neutral-700 bg-neutral-950/70 px-2.5 py-1 text-xs text-neutral-300">{jobs.length}</span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {jobs.map(job => (
          <Link key={job.id} href={`/jobs/${job.id}`} className="block" data-testid={`job-link-${job.id}`}>
            <GlassPanel className="border-white/10 bg-black/25 p-4 transition-transform duration-200 hover:-translate-y-0.5 hover:border-white/20">
              <div className="mb-2 flex items-start justify-between gap-3">
                <span className="rounded-full border border-neutral-700 bg-neutral-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-300" data-testid={`job-status-${job.id}`}>
                  {job.status.replace('_', ' ')}
                </span>
                <div className={`mt-1 h-2 w-2 rounded-full ${['ON_SITE', 'IN_PROGRESS'].includes(job.status) ? 'bg-emerald-400' : ['SNAGGING', 'PAUSED'].includes(job.status) ? 'bg-amber-400' : 'bg-neutral-500'}`} />
              </div>

              <h3 className="font-semibold text-white" data-testid={`job-title-${job.id}`}>{job.title}</h3>
              <p className="mt-1 text-xs text-neutral-400" data-testid={`job-client-${job.id}`}>{job.clients?.name || 'Client not assigned'}</p>

              {job.target_start_date && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-neutral-500" data-testid={`job-date-${job.id}`}>
                  <Calendar className="h-3 w-3" />
                  {new Date(job.target_start_date).toLocaleDateString()}
                </div>
              )}
            </GlassPanel>
          </Link>
        ))}

        {jobs.length === 0 && (
          <div className="rounded-xl border border-dashed border-neutral-700 px-4 py-10 text-center text-sm text-neutral-500" data-testid={`jobs-empty-${title.toLowerCase()}`}>
            No jobs yet
          </div>
        )}
      </div>
    </div>
  )
}
