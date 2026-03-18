import { createServerSupabaseClient } from '@/lib/supabase/server'
import { GlassPanel } from '@/components/ui/glass-panel'
import { sendQuote } from '@/lib/actions/quote-lifecycle'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Send, ExternalLink, RefreshCw } from 'lucide-react'
import StevensenProfitSidebar from '@/components/quotes/stevensen-sidebar'
import UpsellManager from '@/components/quotes/upsell-manager'

export default async function QuoteDetail({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
  
  // Fetch Quote, Sections, Upsells, Org Settings
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

  if (error || !quote) {
    notFound()
  }

  // Server Action to handle sending
  async function handleSend() {
    'use server'
    await sendQuote(quote.id)
    redirect(`/quotes/${quote.id}`)
  }

  const formatPence = (pence: number) => 
    (pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const isDraft = quote.status === 'DRAFT'
  const marginFloor = quote.organisations?.margin_floor_percentage || 2000

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/quotes" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-heading font-bold text-slate-900 flex items-center gap-2">
                {quote.reference || `Quote #${quote.id.slice(0, 8)}`}
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                  {quote.status}
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">For {quote.clients?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isDraft && (
              <form action={handleSend}>
                <button type="submit" className="btn-primary flex items-center gap-2 px-4 py-2 bg-safety text-white rounded-lg font-bold shadow-lg shadow-safety/20 hover:bg-safety-600 transition-all">
                  <Send className="w-4 h-4" />
                  Send Quote
                </button>
              </form>
            )}
            <Link href={`/view/${quote.share_token}`} target="_blank" className="p-2 text-slate-400 hover:text-blueprint transition-colors">
              <ExternalLink className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 py-8 grid grid-cols-12 gap-8">
        
        {/* Main Canvas (8 cols) */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          
          {/* Scope of Work */}
          <div className="space-y-6">
            <h2 className="text-xl font-heading font-bold text-slate-900 px-1">Scope of Work</h2>
            {quote.quote_sections?.sort((a: any, b: any) => a.sort_order - b.sort_order).map((section: any) => (
              <GlassPanel key={section.id} className="p-0 bg-white border-slate-200 overflow-hidden group">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-800">{section.title}</h3>
                    <span className="text-xs text-slate-500 uppercase tracking-wide">{section.trade_type}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-slate-900">£{formatPence(section.section_revenue_total)}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Margin: {(section.margin_percentage/100).toFixed(0)}%</p>
                  </div>
                </div>
                
                {/* Internal Costing Grid (Hidden from client view normally, visible here for builder) */}
                <div className="px-6 py-4 grid grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                    <span className="block text-blue-400 uppercase font-bold mb-1">Labour</span>
                    <div className="flex justify-between font-medium text-slate-700">
                      <span>{section.labour_days} days @ £{formatPence(section.labour_day_rate)}</span>
                      <span>£{formatPence(section.labour_cost)}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100">
                    <span className="block text-amber-500 uppercase font-bold mb-1">Materials</span>
                    <div className="flex justify-between font-medium text-slate-700">
                      <span>Est. Cost</span>
                      <span>£{formatPence(section.material_cost_total)}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="block text-slate-400 uppercase font-bold mb-1">Profit</span>
                    <div className="flex justify-between font-medium text-slate-700">
                      <span>Net</span>
                      <span className="text-emerald-600">£{formatPence(section.section_profit)}</span>
                    </div>
                  </div>
                </div>
              </GlassPanel>
            ))}
          </div>

          {/* Upsells Module */}
          <div className="mt-12">
            <UpsellManager quoteId={quote.id} upsells={quote.quote_upsells || []} />
          </div>

        </div>

        {/* Stevensen Profit Sidebar (4 cols) - Sticky */}
        <div className="col-span-12 lg:col-span-4 h-[calc(100vh-100px)] sticky top-24">
          <StevensenProfitSidebar 
            sections={quote.quote_sections || []}
            upsells={quote.quote_upsells || []}
            quoteTotalCost={quote.quote_total_cost}
            quoteAmountNet={quote.quote_amount_net}
            marginPercentage={quote.quote_margin_percentage}
            marginFloor={marginFloor}
          />
        </div>

      </div>
    </div>
  )
}
