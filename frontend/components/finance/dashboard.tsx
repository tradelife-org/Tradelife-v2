'use client'

import { GlassPanel } from '@/components/ui/glass-panel'
import { TrendingDown, TrendingUp, AlertCircle, PieChart } from 'lucide-react'

interface FinanceDashboardProps {
  data: {
    totalRevenue: number
    totalExpenses: number
    currentBalance: number
    burnRate: number
    runway: number
    pots: any[]
  }
}

export default function FinanceDashboard({ data }: FinanceDashboardProps) {
  const formatPence = (p: number) => (p / 100).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })

  // Colors for Pots (Profit First standard-ish)
  const potColors: Record<string, string> = {
    OPERATING: 'bg-blue-500',
    TAX: 'bg-red-500',
    PROFIT: 'bg-green-500',
    RESERVE: 'bg-amber-500'
  }

  return (
    <div className="space-y-8">
      
      {/* Big Numbers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassPanel className="p-6 bg-white border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Balance</p>
          </div>
          <p className="text-3xl font-mono font-bold text-slate-900">{formatPence(data.currentBalance)}</p>
        </GlassPanel>

        <GlassPanel className="p-6 bg-white border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-safety/10 rounded-lg text-safety">
              <TrendingDown className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Burn</p>
          </div>
          <p className="text-3xl font-mono font-bold text-slate-900">{formatPence(data.burnRate)}</p>
        </GlassPanel>

        <GlassPanel className="p-6 bg-slate-900 text-white border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-800 rounded-lg text-blue-400">
              <PieChart className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Runway</p>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-mono font-bold text-white">
              {data.runway > 12 ? '12+' : data.runway.toFixed(1)}
            </p>
            <span className="text-sm text-slate-400">Months</span>
          </div>
        </GlassPanel>
      </div>

      {/* Profit First Pots */}
      <div>
        <h3 className="font-heading font-bold text-slate-900 mb-4 text-xl">Profit First Allocation</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.pots.map((pot: any) => (
            <GlassPanel key={pot.id} className="p-5 bg-white border-slate-200 relative overflow-hidden group hover:scale-[1.02] transition-all">
              <div className={`absolute top-0 left-0 w-1 h-full ${potColors[pot.pot_type] || 'bg-slate-300'}`} />
              
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold bg-slate-50 px-2 py-1 rounded text-slate-500 uppercase tracking-wider">
                  {pot.pot_type}
                </span>
                <span className="text-xs font-mono text-slate-400">{(pot.allocation_percentage / 100).toFixed(0)}%</span>
              </div>
              
              <p className="text-2xl font-mono font-bold text-slate-800">{formatPence(pot.value)}</p>
              <p className="text-[10px] text-slate-400 mt-1">Target Allocation</p>
            </GlassPanel>
          ))}
        </div>
      </div>

    </div>
  )
}
