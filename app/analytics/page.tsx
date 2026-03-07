import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAnalyticsData } from '@/lib/actions/analytics'
import { GlassPanel } from '@/components/ui/glass-panel'
import { TrendingUp, DollarSign, Award } from 'lucide-react'

export default async function AnalyticsPage() {
  const data = await getAnalyticsData()
  const formatPence = (p: number) => (p / 100).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-slate-900">Growth Dashboard</h1>
        <p className="text-slate-500">Business Performance Intelligence</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <GlassPanel className="p-6 bg-slate-900 text-white border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Revenue</p>
          </div>
          <p className="text-4xl font-mono font-bold text-emerald-400">{formatPence(data.grossRevenue)}</p>
        </GlassPanel>

        <GlassPanel className="p-6 bg-white border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Profit</p>
          </div>
          <p className="text-4xl font-mono font-bold text-slate-900">{formatPence(data.netProfit)}</p>
        </GlassPanel>
      </div>

      <GlassPanel className="p-6 bg-white border-slate-200">
        <h3 className="font-heading font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          Top Performing Trades
        </h3>
        
        <div className="space-y-4">
          {data.topTrades.map((trade, idx) => (
            <div key={trade.name} className="relative">
              <div className="flex justify-between items-end mb-1 text-sm">
                <span className="font-bold text-slate-700">#{idx + 1} {trade.name}</span>
                <span className="font-mono text-slate-600">{formatPence(trade.value)}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blueprint rounded-full transition-all duration-1000"
                  style={{ width: `${(trade.value / data.grossRevenue) * 100}%` }}
                />
              </div>
            </div>
          ))}
          {data.topTrades.length === 0 && (
            <p className="text-slate-400 text-sm">No trade data available yet.</p>
          )}
        </div>
      </GlassPanel>
    </div>
  )
}
