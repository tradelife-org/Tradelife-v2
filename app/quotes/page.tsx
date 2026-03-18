const supabase = getSupabaseServerClient()
'use client'

import * as React from 'react'
import Link from 'next/link'
import { getSupabaseServerClient } from "../lib/supabase/server-safe"
import {
  FileText, PlusCircle, TrendingUp, Clock,
  ArrowUpRight, Search,
} from 'lucide-react'
import VoiceIntake from '@/components/voice-intake'
import SceneLayerV3 from "@/visual-engine/scene/SceneLayerV3"

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:    { label: 'Draft',    color: 'text-slate-600', bg: 'bg-slate-100' },
  SENT:     { label: 'Sent',     color: 'text-amber-700', bg: 'bg-amber-50' },
  ACCEPTED: { label: 'Accepted', color: 'text-green-700', bg: 'bg-green-50' },
  DECLINED: { label: 'Declined', color: 'text-red-700',   bg: 'bg-red-50' },
}

interface QuoteRow {
  id: string
  status: string
  reference: string | null
  quote_amount_net: number
  quote_amount_gross: number
  quote_total_cost: number
  quote_profit: number
  quote_margin_percentage: number
  created_at: string
  client_name: string | null
}

function formatPence(pence: number): string {
  return (pence / 100).toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function QuotesDashboard() {
  const [quotes, setQuotes] = React.useState<QuoteRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')

  React.useEffect(() => {
    async function fetchQuotes() {
      // Using singleton

      // Get user's org_id via profile
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single()

      if (!profile) { setLoading(false); return }

      // Fetch quotes with client join
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          id, status, reference,
          quote_amount_net, quote_amount_gross, quote_total_cost,
          quote_profit, quote_margin_percentage,
          created_at,
          clients ( name )
        `)
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setQuotes(data.map((q: any) => ({
          id: q.id,
          status: q.status,
          reference: q.reference,
          quote_amount_net: q.quote_amount_net,
          quote_amount_gross: q.quote_amount_gross,
          quote_total_cost: q.quote_total_cost,
          quote_profit: q.quote_profit,
          quote_margin_percentage: q.quote_margin_percentage,
          created_at: q.created_at,
          client_name: q.clients?.name ?? null,
        })))
      }
      setLoading(false)
    }

    fetchQuotes()
  }, [])

  const filtered = quotes.filter((q) => {
    const term = search.toLowerCase()
    if (!term) return true
    return (
      (q.client_name?.toLowerCase().includes(term)) ||
      (q.reference?.toLowerCase().includes(term)) ||
      q.status.toLowerCase().includes(term)
    )
  })

  const totalValue = quotes.reduce((sum, q) => sum + q.quote_amount_gross, 0)
  const draftCount = quotes.filter((q) => q.status === 'DRAFT').length
  const sentCount = quotes.filter((q) => q.status === 'SENT').length
  const acceptedCount = quotes.filter((q) => q.status === 'ACCEPTED').length

  return (
    <SceneLayerV3 scene="remembrance">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-black text-slate-900" data-testid="dashboard-title">
            Quotes
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-body">
            {quotes.length} total quote{quotes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/quotes/create"
          data-testid="dashboard-new-quote"
          className="inline-flex items-center gap-2 h-11 px-5 bg-blueprint text-white font-semibold rounded-xl hover:bg-blueprint-700 transition-colors shadow-lg shadow-blueprint/20"
        >
          <PlusCircle className="w-4 h-4" />
          New Quote
        </Link>
      </div>

      {/* Van Voice Intake */}
      <VoiceIntake />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-4" data-testid="stat-total-value">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pipeline Value</p>
          <p className="text-2xl font-mono font-bold text-slate-900 mt-1">
            £{formatPence(totalValue)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4" data-testid="stat-draft">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Drafts</p>
          <p className="text-2xl font-mono font-bold text-slate-500 mt-1">{draftCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4" data-testid="stat-sent">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Sent</p>
          <p className="text-2xl font-mono font-bold text-amber-600 mt-1">{sentCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4" data-testid="stat-accepted">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Accepted</p>
          <p className="text-2xl font-mono font-bold text-green-600 mt-1">{acceptedCount}</p>
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
            placeholder="Search by client, reference, status..."
            data-testid="dashboard-search"
            className="w-full h-10 pl-10 pr-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-slate-400 font-body">Loading quotes...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20" data-testid="empty-state">
          <FileText className="w-12 h-12 text-slate-200 mx-auto" />
          <h3 className="mt-4 text-lg font-heading font-bold text-slate-400">
            {search ? 'No matches found' : 'No quotes yet'}
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            {search ? 'Try a different search term' : 'Create your first quote to get started'}
          </p>
          {!search && (
            <Link
              href="/quotes/create"
              className="inline-flex items-center gap-2 mt-4 text-blueprint font-semibold text-sm hover:underline"
            >
              <PlusCircle className="w-4 h-4" />
              Create Quote
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden" data-testid="quotes-table">
          {/* Table Header */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div className="col-span-1">Ref</div>
            <div className="col-span-3">Client</div>
            <div className="col-span-2">Created</div>
            <div className="col-span-2 text-right">Gross</div>
            <div className="col-span-2 text-right">Profit</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1"></div>
          </div>

          {/* Rows */}
          {filtered.map((q) => {
            const status = STATUS_CONFIG[q.status] || STATUS_CONFIG.DRAFT
            return (
              <div
                key={q.id}
                data-testid={`quote-row-${q.id}`}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors items-center"
              >
                <div className="col-span-1 hidden sm:block">
                  <span className="text-xs font-mono text-slate-400">
                    {q.reference || q.id.slice(0, 6)}
                  </span>
                </div>
                <div className="sm:col-span-3">
                  <p className="font-semibold text-slate-900 text-sm truncate">
                    {q.client_name || 'No client'}
                  </p>
                  <p className="text-xs text-slate-400 sm:hidden">
                    {formatDate(q.created_at)} · {q.reference || q.id.slice(0, 6)}
                  </p>
                </div>
                <div className="col-span-2 hidden sm:flex items-center gap-1.5 text-sm text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-slate-300" />
                  {formatDate(q.created_at)}
                </div>
                <div className="sm:col-span-2 sm:text-right">
                  <span className="font-mono text-sm font-semibold text-slate-900" data-testid={`quote-gross-${q.id}`}>
                    £{formatPence(q.quote_amount_gross)}
                  </span>
                </div>
                <div className="col-span-2 text-right hidden sm:block">
                  <span className={`font-mono text-sm ${q.quote_profit > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                    £{formatPence(q.quote_profit)}
                  </span>
                </div>
                <div className="sm:col-span-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${status.bg} ${status.color}`} data-testid={`quote-status-${q.id}`}>
                    {status.label}
                  </span>
                </div>
                <div className="col-span-1 hidden sm:flex justify-end">
                  <Link
                    href={`/quotes/${q.id}`}
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
    </SceneLayerV3>
  )
}
