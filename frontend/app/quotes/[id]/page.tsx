import { createServerSupabaseClient } from '@/lib/supabase/server'
import { GlassPanel } from '@/components/ui/glass-panel'
import { sendQuote } from '@/lib/actions/quote-lifecycle'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Send, ExternalLink } from 'lucide-react'
import { revalidatePath } from 'next/cache'

export default async function QuoteDetail({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  
  // Fetch Quote with Relations
  const { data: quote, error } = await supabase
    .from('quotes')
    .select(`
      *,
      clients ( name, email ),
      quote_sections (
        *,
        quote_line_items ( * )
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !quote) {
    notFound()
  }

  const isDraft = quote.status === 'DRAFT'
  const isSent = quote.status === 'SENT'
  const isAccepted = quote.status === 'ACCEPTED'

  // Server Action to handle sending
  async function handleSend() {
    'use server'
    await sendQuote(quote.id)
    redirect(`/quotes/${quote.id}`)
  }

  const formatPence = (pence: number) => 
    (pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Link href="/quotes" className="p-2 bg-white/50 rounded-full hover:bg-white transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
               <h1 className="text-3xl font-heading font-bold text-slate-900">
                 {quote.reference || `Quote #${quote.id.slice(0, 8)}`}
               </h1>
               <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase
                  ${isDraft ? 'bg-slate-100 text-slate-600' : ''}
                  ${isSent ? 'bg-amber-100 text-amber-700' : ''}
                  ${isAccepted ? 'bg-green-100 text-green-700' : ''}
               `}>
                  {quote.status}
               </span>
            </div>
            <p className="text-slate-500 font-body mt-1">
              For <span className="font-semibold text-slate-700">{quote.clients?.name || 'Unknown Client'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isDraft && (
            <form action={handleSend}>
              <button 
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-safety hover:bg-safety-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 duration-200"
              >
                <Send className="w-4 h-4" />
                Send Quote
              </button>
            </form>
          )}

          {!isDraft && (
             <Link
               href={`/view/${quote.share_token}`}
               target="_blank"
               className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm"
             >
               <ExternalLink className="w-4 h-4" />
               View Public
             </Link>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Quote Details (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
           {/* Summary Card */}
           <GlassPanel className="p-6 bg-white/60">
              <h2 className="text-xl font-heading font-bold text-slate-800 mb-4">Project Summary</h2>
              <div className="grid grid-cols-2 gap-6">
                 <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Created</p>
                    <p className="font-medium text-slate-700 mt-1">{new Date(quote.created_at).toLocaleDateString()}</p>
                 </div>
                 <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Valid Until</p>
                    <p className="font-medium text-slate-700 mt-1">{quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : 'No Expiry'}</p>
                 </div>
                 <div className="col-span-2">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Notes</p>
                    <p className="text-slate-600 mt-1 bg-slate-50 p-3 rounded-lg border border-slate-100">{quote.notes || 'No notes provided.'}</p>
                 </div>
              </div>
           </GlassPanel>

           {/* Sections List */}
           <div className="space-y-4">
              <h3 className="text-lg font-heading font-bold text-slate-700 px-1">Scope of Work</h3>
              {quote.quote_sections?.sort((a: any, b: any) => a.sort_order - b.sort_order).map((section: any) => (
                <GlassPanel key={section.id} className="p-6 bg-white/80 border-white/50 hover:bg-white transition-colors">
                   <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg">{section.title}</h4>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded uppercase font-semibold tracking-wider">
                           {section.trade_type || 'General'}
                        </span>
                      </div>
                      <div className="text-right">
                         <p className="font-mono font-bold text-slate-700 text-lg">£{formatPence(section.section_revenue_total)}</p>
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 bg-slate-50/50 p-3 rounded-lg border border-slate-100/50">
                      <div>
                         <span className="block text-xs text-slate-400 uppercase">Labour</span>
                         <span className="font-mono font-medium">{section.labour_days} days</span>
                      </div>
                      <div>
                         <span className="block text-xs text-slate-400 uppercase">Materials</span>
                         <span className="font-mono font-medium">£{formatPence(section.material_cost_total)}</span>
                      </div>
                   </div>
                </GlassPanel>
              ))}
           </div>
        </div>

        {/* Right: Financials (1 col) */}
        <div className="lg:col-span-1">
           <div className="sticky top-8">
              <GlassPanel className="p-6 bg-slate-900 text-white border-slate-700 shadow-2xl backdrop-blur-xl">
                 <h2 className="text-lg font-heading font-bold mb-6 text-slate-200 border-b border-slate-700 pb-4">Financial Overview</h2>
                 
                 <div className="space-y-4">
                    <div className="flex justify-between items-center text-slate-400 text-sm">
                       <span>Subtotal (Net)</span>
                       <span className="font-mono text-white">£{formatPence(quote.quote_amount_net)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-slate-400 text-sm">
                       <span>VAT ({(quote.vat_rate / 100).toFixed(0)}%)</span>
                       <span className="font-mono text-white">£{formatPence(quote.quote_amount_gross - quote.quote_amount_net)}</span>
                    </div>

                    <div className="h-px bg-slate-700/50 my-2" />

                    <div className="flex justify-between items-center py-2">
                       <span className="font-bold text-lg text-slate-200">Total</span>
                       <span className="font-mono text-3xl font-bold text-safety tracking-tight">£{formatPence(quote.quote_amount_gross)}</span>
                    </div>

                    {/* Internal Only Stats - Collapsible or always visible for owner */}
                    <div className="mt-8 pt-6 border-t border-slate-800">
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Internal Metrics</p>
                       <div className="space-y-3">
                          <div className="flex justify-between text-xs">
                             <span className="text-slate-400">Est. Cost</span>
                             <span className="font-mono text-slate-300">£{formatPence(quote.quote_total_cost)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                             <span className="text-slate-400">Profit</span>
                             <span className={`font-mono font-bold ${quote.quote_profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                £{formatPence(quote.quote_profit)}
                             </span>
                          </div>
                          <div className="space-y-1.5 pt-2">
                             <div className="flex justify-between text-xs text-slate-400">
                                <span>Margin</span>
                                <span className="text-blue-400 font-mono">{(quote.quote_margin_percentage / 100).toFixed(2)}%</span>
                             </div>
                             <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                               <div 
                                 className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                                 style={{ width: `${Math.min(100, Math.max(0, quote.quote_margin_percentage / 100))}%` }}
                               />
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </GlassPanel>
           </div>
        </div>

      </div>
    </div>
  )
}
