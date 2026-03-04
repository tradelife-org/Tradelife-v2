'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Send, CheckCircle, FileText, 
  TrendingUp, Briefcase, AlertCircle
} from 'lucide-react'
import { Quote, QuoteSection, QuoteLineItem } from '@/lib/types/database'
import { sendQuoteAction, convertQuoteToJobAction } from '@/lib/actions/quote-workflow'
import { formatCurrency, formatPercentage } from '@/lib/actions/quotes'

interface QuoteDetailClientProps {
  quote: Quote
  sections: QuoteSection[]
  lines: QuoteLineItem[]
  clientName: string | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:    { label: 'Draft',    color: 'text-slate-600', bg: 'bg-slate-100' },
  SENT:     { label: 'Sent',     color: 'text-amber-700', bg: 'bg-amber-50' },
  ACCEPTED: { label: 'Accepted', color: 'text-green-700', bg: 'bg-green-50' },
  DECLINED: { label: 'Declined', color: 'text-red-700',   bg: 'bg-red-50' },
}

export default function QuoteDetailClient({ 
  quote, 
  sections, 
  lines,
  clientName 
}: QuoteDetailClientProps) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const status = STATUS_CONFIG[quote.status] || STATUS_CONFIG.DRAFT

  const handleSend = async () => {
    if (!confirm('Are you sure you want to mark this quote as SENT?')) return
    setLoading(true)
    setError(null)
    try {
      await sendQuoteAction(quote.id)
      // Router refresh handled by server action revalidate, but we can also refresh here
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleConvert = async () => {
    if (!confirm('Convert this quote to a Job? This will create a new Job record.')) return
    setLoading(true)
    setError(null)
    try {
      const result = await convertQuoteToJobAction(quote.id)
      if (result.success && result.jobId) {
        // router.push(`/jobs/${result.jobId}`) // Job page might not exist yet
        alert('Job created successfully!')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Calculate VAT amount for display
  const vatAmount = Math.round(quote.quote_amount_net * quote.vat_rate / 10000)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Link */}
      <Link 
        href="/quotes" 
        className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Quotes
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-heading font-bold text-slate-900">
                {quote.reference || `Quote #${quote.id.slice(0, 8)}`}
              </h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${status.bg} ${status.color}`}>
                {status.label}
              </span>
            </div>
            <p className="text-slate-500 font-body">
              For <span className="font-semibold text-slate-900">{clientName || 'Unknown Client'}</span>
            </p>
            {quote.job_id && (
              <p className="text-sm text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                Converted to Job
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Send Button */}
            {quote.status === 'DRAFT' && (
              <button
                onClick={handleSend}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
                {loading ? 'Sending...' : 'Mark as Sent'}
              </button>
            )}

            {/* Convert Button */}
            {(quote.status === 'SENT' || quote.status === 'ACCEPTED') && !quote.job_id && (
              <button
                onClick={handleConvert}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blueprint text-white rounded-lg font-semibold hover:bg-blueprint-700 disabled:opacity-50 transition-colors shadow-lg shadow-blueprint/20"
              >
                <Briefcase className="w-4 h-4" />
                {loading ? 'Converting...' : 'Convert to Job'}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Sections & Lines */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-heading font-bold text-slate-900">Quote Breakdown</h2>
          
          {sections.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <p className="text-slate-400">No sections added yet.</p>
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-900">{section.title}</h3>
                  <span className="font-mono text-slate-600 font-medium">
                    {formatCurrency(section.section_revenue_total)}
                  </span>
                </div>
                <div className="p-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-400 border-b border-slate-100">
                        <th className="pb-2 font-medium">Description</th>
                        <th className="pb-2 font-medium text-right">Qty</th>
                        <th className="pb-2 font-medium text-right">Unit Price</th>
                        <th className="pb-2 font-medium text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {lines
                        .filter(l => l.quote_section_id === section.id)
                        .map(line => (
                          <tr key={line.id}>
                            <td className="py-2 text-slate-700">{line.description}</td>
                            <td className="py-2 text-right text-slate-500">{line.quantity} {line.unit}</td>
                            <td className="py-2 text-right text-slate-500">{formatCurrency(line.unit_price_net)}</td>
                            <td className="py-2 text-right font-mono text-slate-700">{formatCurrency(line.line_total_net)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  
                  {lines.filter(l => l.quote_section_id === section.id).length === 0 && (
                    <p className="text-xs text-slate-400 italic mt-2">No items in this section.</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar: Financials */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-6 sticky top-6">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Financial Summary</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Net Amount</span>
                <span className="font-mono font-medium text-slate-900">{formatCurrency(quote.quote_amount_net)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">VAT ({formatPercentage(quote.vat_rate)})</span>
                <span className="font-mono font-medium text-slate-900">{formatCurrency(vatAmount)}</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                <span className="font-bold text-slate-900">Total Gross</span>
                <span className="font-mono font-bold text-xl text-slate-900">{formatCurrency(quote.quote_amount_gross)}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Internal Profitability</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Total Cost</span>
                  <span className="font-mono text-slate-700">{formatCurrency(quote.quote_total_cost)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Net Profit</span>
                  <span className="font-mono font-semibold text-green-600">{formatCurrency(quote.quote_profit)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Margin</span>
                  <span className="font-mono font-semibold text-blueprint">{formatPercentage(quote.quote_margin_percentage)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
