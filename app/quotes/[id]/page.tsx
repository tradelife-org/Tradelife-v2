import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendQuote } from '@/lib/actions/quote-lifecycle'
import { recalculateQuote } from '@/lib/actions/quotes'
import { getFinanceDashboardData } from '@/lib/actions/finance'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Send, ExternalLink } from 'lucide-react'
import StevensenProfitSidebar from '@/components/quotes/stevensen-sidebar'

export default async function QuoteDetail({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
  
  const { data: quote, error } = await supabase
    .from('quotes')
    .select(`
      *,
      clients ( name, email ),
      organisations ( margin_floor_percentage ),
      quote_sections (
        *,
        quote_line_items ( * )
      ),
      quote_upsells ( * )
    `)
    .eq('id', params.id)
    .eq('org_id', profile?.org_id)
    .single()

  if (error || !quote) notFound()

  async function handleSend() {
    'use server'
    await sendQuote(quote.id)
    redirect(`/quotes/${quote.id}`)
  }

  const formatPence = (pence: number) => 
    '£' + (pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const isDraft = quote.status === 'DRAFT'
  const marginFloor = quote.organisations?.margin_floor_percentage || 2000

  // Outcome layer from finance + margin engine
  let outcomeLayer = null
  let financialContext: { monthlyBurn: number; targetRevenue: number; jobsPerMonth: number } | null = null
  try {
    const finance = await getFinanceDashboardData()
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', quote.org_id)
      .eq('status', 'COMPLETED')
      .gte('updated_at', ninetyDaysAgo)
    const jobsPerMonth = (count && count >= 3) ? Math.round(count / 3) : 5

    financialContext = {
      monthlyBurn: finance.burnRate,
      targetRevenue: finance.burnRate * 1.3,
      jobsPerMonth,
    }
    const sections = (quote.quote_sections || []).map((s: any) => ({
      is_subcontract: s.is_subcontract,
      labour_days: s.labour_days,
      labour_day_rate: s.labour_day_rate,
      subcontract_cost: s.subcontract_cost,
      material_cost_total: s.material_cost_total,
      margin_percentage: s.margin_percentage,
    }))
    const result = recalculateQuote({ vat_rate: quote.vat_rate, sections }, financialContext)
    outcomeLayer = result.outcomeLayer
  } catch (e) {
    // Finance data unavailable
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6" data-testid="quote-detail-page">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/quotes" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" data-testid="back-to-quotes">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2" data-testid="quote-reference">
              {quote.reference || `Quote #${quote.id.slice(0, 8)}`}
              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                {quote.status}
              </span>
            </h1>
            <p className="text-xs text-gray-500" data-testid="quote-client">For {quote.clients?.name || 'Unknown client'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isDraft && (
            <form action={handleSend}>
              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors" data-testid="send-quote-button">
                <Send className="w-4 h-4" />
                Send Quote
              </button>
            </form>
          )}
          {quote.share_token && (
            <Link href={`/view/${quote.share_token}`} target="_blank" className="p-2 text-gray-400 hover:text-blue-600 transition-colors" data-testid="preview-link">
              <ExternalLink className="w-5 h-5" />
            </Link>
          )}
        </div>
      </div>

      {/* Quote info summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm" data-testid="quote-info">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Net Total</p>
            <p className="text-lg font-mono font-bold text-gray-900" data-testid="quote-net-total">{formatPence(quote.quote_amount_net)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Cost</p>
            <p className="text-lg font-mono font-bold text-gray-700" data-testid="quote-total-cost">{formatPence(quote.quote_total_cost)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Profit</p>
            <p className={`text-lg font-mono font-bold ${quote.quote_profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`} data-testid="quote-profit">{formatPence(quote.quote_profit)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Margin</p>
            <p className="text-lg font-mono font-bold text-gray-900" data-testid="quote-margin">{(quote.quote_margin_percentage / 100).toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Scope of Work</h2>

          {(!quote.quote_sections || quote.quote_sections.length === 0) ? (
            <p className="text-sm text-gray-500" data-testid="no-sections">No sections in this quote.</p>
          ) : (
            quote.quote_sections.sort((a: any, b: any) => a.sort_order - b.sort_order).map((section: any) => (
              <div key={section.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm" data-testid={`section-${section.id}`}>
                {/* Section header */}
                <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-900">{section.title}</h3>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">{section.trade_type}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-gray-900">{formatPence(section.section_revenue_total)}</p>
                    <p className="text-[10px] text-gray-400 font-mono">Margin: {(section.margin_percentage/100).toFixed(0)}%</p>
                  </div>
                </div>
                
                {/* Cost breakdown grid */}
                <div className="px-5 py-4 grid grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <span className="block text-blue-600 uppercase font-bold mb-1">Labour</span>
                    <div className="flex justify-between font-medium text-gray-700">
                      <span>{section.labour_days} days @ {formatPence(section.labour_day_rate)}</span>
                      <span>{formatPence(section.labour_cost)}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <span className="block text-amber-600 uppercase font-bold mb-1">Materials</span>
                    <div className="flex justify-between font-medium text-gray-700">
                      <span>Est. Cost</span>
                      <span>{formatPence(section.material_cost_total)}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="block text-gray-500 uppercase font-bold mb-1">Profit</span>
                    <div className="flex justify-between font-medium text-gray-700">
                      <span>Net</span>
                      <span className="text-emerald-600">{formatPence(section.section_profit)}</span>
                    </div>
                  </div>
                </div>

                {/* Line items */}
                {section.quote_line_items && section.quote_line_items.length > 0 && (
                  <div className="px-5 pb-4">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-400 uppercase tracking-wider border-b border-gray-100">
                          <th className="text-left py-2 font-medium">Item</th>
                          <th className="text-right py-2 font-medium">Qty</th>
                          <th className="text-right py-2 font-medium">Unit Price</th>
                          <th className="text-right py-2 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.quote_line_items.sort((a: any, b: any) => a.sort_order - b.sort_order).map((item: any) => (
                          <tr key={item.id} className="border-b border-gray-50">
                            <td className="py-2 text-gray-700">{item.description}</td>
                            <td className="py-2 text-right text-gray-600">{item.quantity} {item.unit}</td>
                            <td className="py-2 text-right font-mono text-gray-600">{formatPence(item.unit_price_net)}</td>
                            <td className="py-2 text-right font-mono font-medium text-gray-900">{formatPence(item.line_total_net)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Sidebar (1 col) */}
        <div className="lg:col-span-1">
          <StevensenProfitSidebar 
            sections={quote.quote_sections || []}
            upsells={quote.quote_upsells || []}
            quoteTotalCost={quote.quote_total_cost}
            quoteAmountNet={quote.quote_amount_net}
            marginPercentage={quote.quote_margin_percentage}
            marginFloor={marginFloor}
            outcomeLayer={outcomeLayer}
            jobsPerMonth={financialContext?.jobsPerMonth ?? null}
          />
        </div>
      </div>
    </div>
  )
}
