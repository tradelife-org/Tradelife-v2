'use client'

import * as React from 'react'
import { Sparkles, Loader2, RefreshCw } from 'lucide-react'
import { getDailyBriefAction } from '@/lib/actions/command-center'

interface DailyBrief {
  burn_rate: number
  recognized_revenue: number
  schedule_items: { id: string; title: string; date: string }[]
}

export function JarvisHub() {
  const [loading, setLoading] = React.useState(false)
  const [brief, setBrief] = React.useState<DailyBrief | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const handleAction = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getDailyBriefAction()
      setBrief({
        burn_rate: data.burn_rate,
        recognized_revenue: data.recognized_revenue,
        schedule_items: data.schedule_items
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Currency Formatter (BIGINT pence)
  const formatCurrency = (pence: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(pence / 100)
  }

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-black rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl col-span-1 md:col-span-2 lg:col-span-1 h-full flex flex-col justify-between group">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-20 -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500 rounded-full blur-[100px] opacity-10 -ml-20 -mb-20"></div>

      <div className="relative z-10 flex flex-col items-center justify-center flex-1 space-y-8">
        
        {/* Action Button */}
        <button
          onClick={handleAction}
          disabled={loading}
          className="relative w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 p-[2px] shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)] hover:shadow-[0_0_60px_-10px_rgba(99,102,241,0.7)] transition-all transform hover:scale-105 active:scale-95 group-hover:animate-pulse-slow"
        >
          <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            {loading ? (
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            ) : (
              <Sparkles className="w-10 h-10 text-white" />
            )}
          </div>
          {/* Glowing Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-white/10 animate-ping opacity-20" style={{ animationDuration: '3s' }}></div>
        </button>

        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            {loading ? 'Processing...' : brief ? 'Daily Brief Ready' : 'Initialize Jarvis'}
          </h2>
          <p className="text-slate-400 text-sm">
            {brief ? 'Summary updated just now' : 'Tap for daily intelligence'}
          </p>
        </div>

        {/* Results Area */}
        {brief && (
          <div className="w-full bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Burn Rate</p>
                <p className="text-lg font-mono font-bold text-red-400">{formatCurrency(brief.burn_rate)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Rec. Revenue</p>
                <p className="text-lg font-mono font-bold text-emerald-400">{formatCurrency(brief.recognized_revenue)}</p>
              </div>
            </div>
            
            <div className="pt-3 border-t border-white/10">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <RefreshCw className="w-3 h-3" />
                Next 3 Schedule
              </p>
              <ul className="space-y-2 text-sm text-slate-300">
                {brief.schedule_items.map((item) => (
                  <li key={item.id} className="flex justify-between items-center truncate">
                    <span className="truncate flex-1 pr-2">{item.title}</span>
                    <span className="text-slate-500 text-xs shrink-0">{new Date(item.date).toLocaleDateString()}</span>
                  </li>
                ))}
                {brief.schedule_items.length === 0 && (
                   <li className="text-slate-500 italic">No upcoming items</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {error && (
            <div className="bg-red-500/20 text-red-200 text-xs p-2 rounded w-full text-center border border-red-500/30">
                {error}
            </div>
        )}

      </div>
    </div>
  )
}
