'use client'

import * as React from 'react'
import { type PublicQuoteData } from '@/lib/actions/public-quote'
import { Check, FileText, Shield, Clock } from 'lucide-react'

function fmt(pence: number): string {
  return (pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

const STATUS_DISPLAY: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:    { label: 'Draft',    color: 'text-slate-600', bg: 'bg-slate-100' },
  SENT:     { label: 'Awaiting Response', color: 'text-amber-700', bg: 'bg-amber-50' },
  ACCEPTED: { label: 'Accepted', color: 'text-green-700', bg: 'bg-green-50' },
  DECLINED: { label: 'Declined', color: 'text-red-700',   bg: 'bg-red-50' },
}

interface Props {
  quote: PublicQuoteData
  shareToken: string
}

export function PublicQuoteClient({ quote, shareToken }: Props) {
  const [accepting, setAccepting] = React.useState(false)
  const [accepted, setAccepted] = React.useState(quote.status === 'ACCEPTED')
  const [error, setError] = React.useState('')

  const vatAmount = quote.quote_amount_gross - quote.quote_amount_net
  const status = STATUS_DISPLAY[accepted ? 'ACCEPTED' : quote.status] || STATUS_DISPLAY.SENT

  const handleAccept = async () => {
    setAccepting(true)
    setError('')
    try {
      const res = await fetch('/api/quotes/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ share_token: shareToken }),
      })
      const result = await res.json()
      if (result.success) {
        setAccepted(true)
      } else {
        setError(result.error || 'Something went wrong')
      }
    } catch {
      setError('Network error. Please try again.')
    }
    setAccepting(false)
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Quote from</p>
              <h1 className="text-2xl font-heading font-black text-slate-900 mt-1" data-testid="quote-org-name">
                {quote.org_name}
              </h1>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${status.bg} ${status.color}`} data-testid="quote-status-badge">
              {accepted && <Check className="w-4 h-4 mr-1" />}
              {status.label}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Quote Meta */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {quote.reference && (
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Reference</p>
                <p className="text-sm font-semibold text-slate-900 mt-1" data-testid="quote-reference">{quote.reference}</p>
              </div>
            )}
            {quote.client_name && (
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Prepared for</p>
                <p className="text-sm font-semibold text-slate-900 mt-1" data-testid="quote-client-name">{quote.client_name}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Date</p>
              <p className="text-sm font-semibold text-slate-900 mt-1">{fmtDate(quote.created_at)}</p>
            </div>
            {quote.valid_until && (
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Valid until</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">{fmtDate(quote.valid_until)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Scope of Works (sections) */}
        {quote.sections.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h2 className="font-heading font-bold text-lg text-slate-900">Scope of Works</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {quote.sections.map((s, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{s.title}</p>
                    {s.trade_type && <p className="text-xs text-slate-400 mt-0.5">{s.trade_type}</p>}
                  </div>
                  <span className="font-mono text-sm font-semibold text-slate-700" data-testid={`scope-amount-${i}`}>
                    £{fmt(s.section_revenue_total)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Itemised Breakdown */}
        {quote.line_items.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h2 className="font-heading font-bold text-lg text-slate-900">Itemised Breakdown</h2>
            </div>
            {/* Header Row */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-2.5 border-b border-slate-200 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <div className="col-span-6">Description</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2 text-right">Unit Price</div>
              <div className="col-span-2 text-right">Total</div>
            </div>
            <div className="divide-y divide-slate-100">
              {quote.line_items.map((li, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 px-6 py-4 items-center"
                  data-testid={`line-item-${i}`}
                >
                  <div className="sm:col-span-6">
                    <p className="font-medium text-sm text-slate-900">{li.description}</p>
                  </div>
                  <div className="sm:col-span-2 sm:text-center">
                    <span className="text-sm text-slate-500">
                      {li.quantity} {li.unit}
                    </span>
                  </div>
                  <div className="sm:col-span-2 sm:text-right">
                    <span className="font-mono text-sm text-slate-500">£{fmt(li.unit_price_net)}</span>
                  </div>
                  <div className="sm:col-span-2 sm:text-right">
                    <span className="font-mono text-sm font-semibold text-slate-900" data-testid={`line-total-${i}`}>
                      £{fmt(li.line_total_net)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Subtotal (Net)</span>
              <span className="font-mono text-base text-slate-700" data-testid="quote-net">
                £{fmt(quote.quote_amount_net)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">VAT ({(quote.vat_rate / 100).toFixed(0)}%)</span>
              <span className="font-mono text-sm text-slate-400" data-testid="quote-vat">
                £{fmt(vatAmount)}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-heading font-bold text-slate-900">Total</span>
                <span className="font-mono text-2xl font-bold text-slate-900" data-testid="quote-gross-total">
                  £{fmt(quote.quote_amount_gross)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Accept / Status Section */}
        {!accepted && quote.status === 'SENT' && (
          <div className="bg-white rounded-xl border-2 border-green-200 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-heading font-bold text-slate-900">Accept this quote</h3>
                <p className="text-sm text-slate-500 mt-1">
                  By clicking below, you agree to the scope of works and pricing detailed above. This quote will become binding.
                </p>
              </div>
            </div>
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm" data-testid="accept-error">
                {error}
              </div>
            )}
            <button
              onClick={handleAccept}
              disabled={accepting}
              data-testid="accept-quote-btn"
              className="w-full h-14 flex items-center justify-center gap-2 bg-green-600 text-white font-semibold text-lg rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {accepting ? (
                <span className="animate-pulse">Accepting...</span>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Accept & Sign
                </>
              )}
            </button>
          </div>
        )}

        {accepted && (
          <div className="bg-green-50 rounded-xl border border-green-200 p-6 text-center space-y-2" data-testid="accepted-confirmation">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mx-auto">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-heading font-bold text-green-800 text-lg">Quote Accepted</h3>
            <p className="text-sm text-green-600">
              Thank you. This quote has been accepted and is now confirmed.
            </p>
          </div>
        )}

        {quote.status === 'DRAFT' && !accepted && (
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-6 text-center space-y-2" data-testid="draft-notice">
            <Clock className="w-6 h-6 text-amber-500 mx-auto" />
            <h3 className="font-heading font-bold text-amber-800">Quote in progress</h3>
            <p className="text-sm text-amber-600">
              This quote hasn't been sent yet. You'll receive an email when it's ready for review.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-xs text-slate-300">
            Powered by <span className="font-heading font-bold">TradeLife</span>
          </p>
        </div>
      </div>
    </main>
  )
}
