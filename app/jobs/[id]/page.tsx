import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, MapPin, FileText } from 'lucide-react'

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

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: job, error } = await supabase
    .from('jobs')
    .select('id, title, status, address, target_start_date, target_end_date, source_quote_id, created_at, clients(name)')
    .eq('id', params.id)
    .single()

  if (error || !job) notFound()

  const formatPence = (p: number) =>
    '£' + (p / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null

  // Fetch linked quote if exists
  let quote: any = null
  if (job.source_quote_id) {
    const { data } = await supabase
      .from('quotes')
      .select('id, reference, quote_amount_net, quote_profit')
      .eq('id', job.source_quote_id)
      .single()
    quote = data
  }

  // Fetch job ledger entries
  const { data: ledger } = await supabase
    .from('job_wallet_ledger')
    .select('amount, transaction_type')
    .eq('job_id', job.id)

  let jobRevenue = 0
  let jobExpenses = 0
  if (ledger) {
    for (const entry of ledger) {
      if (entry.transaction_type === 'CREDIT') jobRevenue += entry.amount
      else if (entry.transaction_type === 'DEBIT') jobExpenses += entry.amount
    }
  }
  const jobProfit = jobRevenue - jobExpenses

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6" data-testid="job-detail-page">
      {/* Back link */}
      <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors" data-testid="back-to-jobs">
        <ArrowLeft className="w-4 h-4" />
        Back to Jobs
      </Link>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm" data-testid="job-header">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900" data-testid="job-title">{job.title}</h1>
            <p className="text-sm text-gray-500 mt-0.5" data-testid="job-client">{(job as any).clients?.name || 'No client'}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusColor[job.status] || 'bg-slate-100 text-slate-500'}`}
            data-testid="job-status-badge"
          >
            {job.status.replace('_', ' ')}
          </span>
        </div>

        {job.address && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3" data-testid="job-address">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
            {job.address}
          </div>
        )}

        {/* Dates */}
        <div className="flex items-center gap-6 text-sm text-gray-600">
          {job.target_start_date && (
            <div className="flex items-center gap-1.5" data-testid="job-start-date">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Start: {fmtDate(job.target_start_date)}</span>
            </div>
          )}
          {job.target_end_date && (
            <div className="flex items-center gap-1.5" data-testid="job-end-date">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>End: {fmtDate(job.target_end_date)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Linked Quote */}
      {quote && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm" data-testid="linked-quote-section">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Linked Quote</h2>
          <Link
            href={`/quotes/${quote.id}`}
            className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
            data-testid="linked-quote-link"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">{quote.reference || `Quote #${quote.id.slice(0, 8)}`}</p>
                <p className="text-xs text-gray-500">Job created from accepted quote</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono font-medium text-gray-900">{formatPence(quote.quote_amount_net)}</p>
              <p className="text-xs font-mono text-gray-500">Profit: {formatPence(quote.quote_profit)}</p>
            </div>
          </Link>
        </div>
      )}

      {/* Job Financial Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm" data-testid="job-financial-summary">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Job Financial Summary</h2>

        <p className={`text-xs font-medium mb-4 ${jobRevenue > 0 ? 'text-emerald-600' : 'text-gray-400'}`} data-testid="payment-status-message">
          {jobRevenue > 0 ? 'Payment received' : 'No payments yet'}
        </p>

        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200" data-testid="job-revenue-box">
            <p className="text-xs text-gray-500 mb-1">Revenue</p>
            <p className="text-lg font-mono font-bold text-gray-900">{formatPence(jobRevenue)}</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200" data-testid="job-costs-box">
            <p className="text-xs text-gray-500 mb-1">Costs</p>
            <p className="text-lg font-mono font-bold text-gray-700">{formatPence(jobExpenses)}</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200" data-testid="job-profit-box">
            <p className="text-xs text-gray-500 mb-1">Profit</p>
            <p className={`text-lg font-mono font-bold ${jobProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatPence(jobProfit)}</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm" data-testid="job-summary">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Summary</h2>
        <p className="text-sm text-gray-600">
          {job.source_quote_id
            ? 'This job was created from an accepted quote.'
            : 'This job was created manually.'}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Created {fmtDate(job.created_at)}
        </p>
      </div>
    </div>
  )
}
