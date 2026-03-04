'use client'

import * as React from 'react'
import {
  Activity, TrendingDown, TrendingUp, AlertTriangle,
  Wallet, Calendar
} from 'lucide-react'
import { formatCurrency } from '@/lib/actions/quotes'
import { getDashboardMetrics } from '@/lib/actions/dashboard'

export default function DashboardPage() {
  const [metrics, setMetrics] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetch() {
      try {
        const data = await getDashboardMetrics()
        setMetrics(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-slate-400">Loading Dashboard...</div>
      </div>
    )
  }

  if (!metrics) return null

  const isProfitable = metrics.netPosition >= 0
  const pulseColor = isProfitable ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'
  const pulseIcon = isProfitable ? TrendingUp : TrendingDown

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-black text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Financial Overview & Operational Health</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Pulse (Net Position) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">The Pulse (Net)</p>
              <h3 className={`text-2xl font-mono font-bold mt-1 ${isProfitable ? 'text-emerald-700' : 'text-red-700'}`}>
                {formatCurrency(metrics.netPosition)}
              </h3>
            </div>
            <div className={`p-2.5 rounded-xl ${pulseColor}`}>
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Last 30 Days
          </div>
        </div>

        {/* Monthly Burn */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Burn</p>
              <h3 className="text-2xl font-mono font-bold text-slate-900 mt-1">
                {formatCurrency(metrics.monthlyBurn)}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Avg. {formatCurrency(Math.round(metrics.dailyBurn))} / day
          </div>
        </div>

        {/* Recognized Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recognized Revenue</p>
              <h3 className="text-2xl font-mono font-bold text-slate-900 mt-1">
                {formatCurrency(metrics.recognizedRevenue)}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-green-50 text-green-600">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Lifetime Total
          </div>
        </div>

        {/* Survival Runway */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Survival Runway</p>
              <h3 className="text-2xl font-mono font-bold text-slate-900 mt-1">
                {metrics.runwayDays === 999 ? '∞' : metrics.runwayDays} <span className="text-sm font-sans font-medium text-slate-500">days</span>
              </h3>
            </div>
            <div className={`p-2.5 rounded-xl ${metrics.runwayDays < 30 ? 'bg-red-50 text-red-600' : 'bg-blueprint-50 text-blueprint'}`}>
              {metrics.runwayDays < 30 ? <AlertTriangle className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Based on current cash & burn
          </div>
        </div>

      </div>
    </div>
  )
}
