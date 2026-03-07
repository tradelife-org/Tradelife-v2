import { createServerSupabaseClient } from '@/lib/supabase/server'
import { GlassPanel } from '@/components/ui/glass-panel'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, ShieldCheck, User } from 'lucide-react'

export default async function ProposalDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  
  // This is the internal view, not public
  const { data: quote } = await supabase
    .from('quotes')
    .select(`
      *,
      clients ( name ),
      quote_snapshots (
        accepted_at,
        accepted_by_name,
        accepted_ip,
        snapshot_data,
        total_amount_gross
      )
    `)
    .eq('id', params.id)
    .single()

  if (!quote) notFound()

  // Use snapshot data if accepted, else live data
  const data = quote.status === 'ACCEPTED' && quote.quote_snapshots 
    ? quote.quote_snapshots.snapshot_data 
    : quote

  const formatPence = (p: number) => (p / 100).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <Link href="/quotes" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <GlassPanel className="p-8 bg-white border-slate-200">
            <h1 className="text-2xl font-heading font-bold text-slate-900 mb-2">{quote.reference || 'Proposal'}</h1>
            <p className="text-slate-500 mb-6">Prepared for {quote.clients?.name}</p>
            
            <div className="space-y-6">
              {data.quote_sections?.map((section: any) => (
                <div key={section.id} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800">{section.title}</h3>
                    <span className="font-mono font-bold text-slate-700">{formatPence(section.section_revenue_total)}</span>
                  </div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">{section.trade_type}</p>
                  <ul className="text-sm text-slate-600 list-disc pl-4 space-y-1">
                    {section.quote_line_items?.map((item: any) => (
                      <li key={item.id}>{item.description}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <GlassPanel className="p-6 bg-slate-50 border-slate-200">
            <h3 className="font-bold text-slate-900 mb-4">Status</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Current State</span>
                <span className={`font-bold uppercase ${quote.status === 'ACCEPTED' ? 'text-emerald-600' : 'text-slate-600'}`}>
                  {quote.status}
                </span>
              </div>
              
              {quote.status === 'ACCEPTED' && quote.quote_snapshots && (
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    Digitally Signed
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Signed By</span>
                    <span>{quote.quote_snapshots.accepted_by_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Date</span>
                    <span>{new Date(quote.quote_snapshots.accepted_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">IP Address</span>
                    <span className="font-mono">{quote.quote_snapshots.accepted_ip}</span>
                  </div>
                </div>
              )}
            </div>
          </GlassPanel>

          <GlassPanel className="p-6 bg-slate-900 text-white border-slate-700">
            <h3 className="font-bold text-slate-400 uppercase text-xs tracking-wider mb-4">Financials</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Net</span>
                <span className="font-mono">{formatPence(data.quote_amount_net)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">VAT</span>
                <span className="font-mono">{formatPence(data.quote_amount_gross - data.quote_amount_net)}</span>
              </div>
              <div className="pt-2 mt-2 border-t border-slate-700 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-emerald-400">{formatPence(data.quote_amount_gross)}</span>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  )
}
