'use client'

import * as React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Briefcase, Search, ArrowUpRight,
  Clock
} from 'lucide-react'
import { createDepositInvoiceAction } from '@/lib/actions/invoices'
import { useRouter } from 'next/navigation'

interface JobRow {
  id: string
  title: string
  status: string
  client_name: string | null
  created_at: string
}

const JOB_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ENQUIRY:    { label: 'Enquiry',    color: 'text-slate-600', bg: 'bg-slate-100' },
  BOOKED:     { label: 'Booked',     color: 'text-blue-700',  bg: 'bg-blue-50' },
  ON_SITE:    { label: 'On Site',    color: 'text-amber-700', bg: 'bg-amber-50' },
  COMPLETED:  { label: 'Completed',  color: 'text-green-700', bg: 'bg-green-50' },
  SNAGGING:   { label: 'Snagging',   color: 'text-orange-700', bg: 'bg-orange-50' },
  SIGNED_OFF: { label: 'Signed Off', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  CANCELLED:  { label: 'Cancelled',  color: 'text-red-700',   bg: 'bg-red-50' },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function JobsDashboard() {
  const router = useRouter()
  const [jobs, setJobs] = React.useState<JobRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [actionLoading, setActionLoading] = React.useState<string | null>(null) // jobId being processed

  const fetchJobs = React.useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!profile) { setLoading(false); return }

    const { data, error } = await supabase
      .from('jobs')
      .select(`
        id, title, status, created_at,
        clients ( name )
      `)
      .eq('org_id', profile.org_id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setJobs(data.map((j: any) => ({
        id: j.id,
        title: j.title,
        status: j.status,
        client_name: j.clients?.name ?? 'Unknown Client',
        created_at: j.created_at,
      })))
    }
    setLoading(false)
  }, [])

  React.useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const handleCreateDeposit = async (jobId: string) => {
    if (!confirm('Generate 25% Deposit Invoice for this job?')) return
    setActionLoading(jobId)
    try {
      const result = await createDepositInvoiceAction(jobId)
      if (result.success) {
        alert('Invoice created successfully!')
        // Ideally router.push to the invoice page, but for now just refresh or stay
        router.refresh()
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = jobs.filter((j) => {
    const term = search.toLowerCase()
    if (!term) return true
    return (
      j.title.toLowerCase().includes(term) ||
      (j.client_name?.toLowerCase().includes(term)) ||
      j.status.toLowerCase().includes(term)
    )
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-black text-slate-900">Jobs</h1>
          <p className="text-sm text-slate-400 mt-1 font-body">
            {jobs.length} active job{jobs.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs..."
            className="w-full h-10 pl-10 pr-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-slate-400 font-body">Loading jobs...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Briefcase className="w-12 h-12 text-slate-200 mx-auto" />
          <h3 className="mt-4 text-lg font-heading font-bold text-slate-400">
            {search ? 'No matches found' : 'No jobs yet'}
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            {search ? 'Try a different search term' : 'Convert a quote to get started'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Header Row */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div className="col-span-5">Job / Client</div>
            <div className="col-span-2">Created</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>

          {/* Data Rows */}
          {filtered.map((j) => {
            const status = JOB_STATUS_CONFIG[j.status] || JOB_STATUS_CONFIG.ENQUIRY
            return (
              <div
                key={j.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors items-center"
              >
                <div className="sm:col-span-5">
                  <p className="font-semibold text-slate-900 text-sm truncate">{j.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{j.client_name}</p>
                </div>
                <div className="col-span-2 hidden sm:flex items-center gap-1.5 text-sm text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-slate-300" />
                  {formatDate(j.created_at)}
                </div>
                <div className="sm:col-span-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${status.bg} ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <div className="col-span-3 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleCreateDeposit(j.id)}
                    disabled={!!actionLoading}
                    className="text-xs font-medium text-blueprint hover:text-blueprint-700 bg-blueprint-50 hover:bg-blueprint-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {actionLoading === j.id ? 'Processing...' : 'Create Deposit'}
                  </button>
                  <Link
                    href={`/jobs/${j.id}`}
                    className="p-1.5 text-slate-300 hover:text-blueprint rounded-lg hover:bg-blueprint-50 transition-colors"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
