'use client'

import { GlassPanel } from '@/components/ui/glass-panel'
import { AlertTriangle, CheckCircle, Clock, Zap, DollarSign, TrendingUp, Calendar, Wrench } from 'lucide-react'

// --- Attention Needed ---
export function AttentionNeeded({ items }: { items: { id: string, title: string, issue?: string }[] }) {
  return (
    <GlassPanel className="h-full p-4 border-l-4 border-l-orange-500 bg-white shadow-sm">
      <h3 className="font-heading font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-orange-500" />
        Attention Needed
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No urgent items.</p>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="text-xs p-2 bg-orange-50 rounded border border-orange-100">
              <p className="font-bold text-slate-800">{item.title}</p>
              <p className="text-orange-700">{item.issue}</p>
            </div>
          ))}
        </div>
      )}
    </GlassPanel>
  )
}

// --- Active Projects ---
export function ActiveProjects({ items }: { items: { id: string, title: string, client?: string }[] }) {
  return (
    <GlassPanel className="h-full p-4 bg-white shadow-sm">
      <h3 className="font-heading font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
        <Zap className="w-4 h-4 text-blue-500" />
        Active Projects
      </h3>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded transition-colors cursor-pointer">
            <div>
              <p className="text-xs font-bold text-slate-800">{item.title}</p>
              <p className="text-[10px] text-slate-500">{item.client}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        ))}
      </div>
    </GlassPanel>
  )
}

// --- Live Projects (Visual) ---
export function LiveProjects({ items }: { items: { id: string, title: string, progress?: number }[] }) {
  return (
    <GlassPanel className="h-full p-4 bg-slate-900 text-white shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Zap className="w-24 h-24" />
      </div>
      <h3 className="font-heading font-bold text-sm mb-4 flex items-center gap-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
        Live Sites
      </h3>
      <div className="space-y-4 relative z-10">
        {items.map(item => (
          <div key={item.id}>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-bold text-slate-200">{item.title}</span>
              <span className="text-green-400 font-mono">{item.progress}%</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${item.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  )
}

// --- TTE Schedule ---
export function TTESchedule({ items }: { items: { id: string, title: string, date: string }[] }) {
  return (
    <GlassPanel className="h-full p-4 bg-white shadow-sm">
      <h3 className="font-heading font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4 text-purple-500" />
        Schedule
      </h3>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="flex gap-3 items-center">
            <div className="flex flex-col items-center bg-slate-50 px-2 py-1 rounded border border-slate-100 min-w-[40px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(item.date).toLocaleDateString(undefined, { month: 'short' })}</span>
              <span className="text-sm font-black text-slate-700">{new Date(item.date).getDate()}</span>
            </div>
            <p className="text-xs font-medium text-slate-700 truncate">{item.title}</p>
          </div>
        ))}
      </div>
    </GlassPanel>
  )
}

// --- Urgent Tasks ---
export function UrgentTasks({ items }: { items: { id: string, title: string, issue?: string }[] }) {
  return (
    <GlassPanel className="h-full p-4 bg-red-50 border-red-100 shadow-sm">
      <h3 className="font-heading font-bold text-red-800 text-sm mb-3 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-red-600" />
        Urgent
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-red-400 italic">All clear.</p>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="text-xs flex items-start gap-2">
              <div className="mt-0.5 w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
              <p className="text-red-700 font-medium">{item.title}</p>
            </div>
          ))}
        </div>
      )}
    </GlassPanel>
  )
}

// --- Financial Overview ---
export function FinancialOverview({ data }: { data: { revenue: number, expenses: number, retention: number } }) {
  const format = (n: number) => (n / 100).toLocaleString('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 })
  return (
    <GlassPanel className="h-full p-6 bg-white border-slate-200 shadow-sm flex flex-col justify-between">
      <div className="flex items-center gap-2 mb-2">
        <DollarSign className="w-5 h-5 text-emerald-600" />
        <h3 className="font-heading font-bold text-slate-800">Financials</h3>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Revenue</p>
          <p className="text-xl font-mono font-bold text-slate-900">{format(data.revenue)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Expenses</p>
          <p className="text-xl font-mono font-bold text-slate-900">{format(data.expenses)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Retention</p>
          <p className="text-xl font-mono font-bold text-blue-600">{format(data.retention)}</p>
        </div>
      </div>
    </GlassPanel>
  )
}

// --- Service Traffic Lights (New) ---
export function ServiceTrafficLights({ items }: { items: { id: string, title: string, date: string, status: 'FUTURE' | 'DUE_SOON' | 'OVERDUE' }[] }) {
  return (
    <GlassPanel className="h-full p-4 bg-white shadow-sm border-slate-200">
      <h3 className="font-heading font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
        <Wrench className="w-4 h-4 text-slate-500" />
        Service Status
      </h3>
      <div className="space-y-2 overflow-y-auto max-h-[200px] pr-1">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{item.title}</p>
              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(item.date).toLocaleDateString()}
              </p>
            </div>
            <div className={`w-3 h-3 rounded-full shrink-0 shadow-sm
              ${item.status === 'FUTURE' ? 'bg-emerald-500' : 
                item.status === 'DUE_SOON' ? 'bg-amber-500 animate-pulse' : 'bg-red-600 animate-ping'}`} 
            />
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-slate-400 italic">No services due.</p>}
      </div>
    </GlassPanel>
  )
}
