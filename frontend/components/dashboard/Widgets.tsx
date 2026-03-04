'use client'

import * as React from 'react'
import { AlertCircle, CheckCircle, Clock, Zap, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react'

// Common Types
interface JobSummary {
  id: string
  title: string
  client?: string
  date?: string
  progress?: number
  issue?: string
}

interface FinancialData {
  revenue: number
  expenses: number
  retention: number
}

// Helper
const formatCurrency = (pence: number) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(pence / 100)
}

// 1. Attention Needed
export function AttentionNeeded({ items }: { items: JobSummary[] }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h3 className="font-heading font-bold text-slate-800">Attention Needed</h3>
      </div>
      <ul className="space-y-3 flex-1 overflow-y-auto pr-2">
        {items.map((item) => (
          <li key={item.id} className="group flex items-start justify-between p-3 rounded-xl bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer">
            <div>
              <p className="font-medium text-slate-900 text-sm">{item.title}</p>
              <p className="text-xs text-amber-600 mt-1 font-medium">{item.issue || 'Action Required'}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-amber-500 mt-2"></div>
          </li>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-400 italic">No alerts.</p>}
      </ul>
    </div>
  )
}

// 2. Active Projects
export function ActiveProjects({ items }: { items: JobSummary[] }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
          <Zap className="w-5 h-5" />
        </div>
        <h3 className="font-heading font-bold text-slate-800">Active Projects</h3>
      </div>
      <ul className="space-y-3 flex-1 overflow-y-auto pr-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                {item.client ? item.client.charAt(0) : 'C'}
              </div>
              <div>
                <p className="font-medium text-slate-900 text-sm truncate max-w-[120px]">{item.title}</p>
                <p className="text-xs text-slate-500">{item.client || 'Unknown Client'}</p>
              </div>
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Active</span>
          </li>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-400 italic">No active projects.</p>}
      </ul>
    </div>
  )
}

// 3. Live Projects (Center)
export function LiveProjects({ items }: { items: JobSummary[] }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col h-full relative overflow-hidden">
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="font-heading font-bold text-slate-800 text-lg">Live Operations</h3>
        <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          ONLINE
        </span>
      </div>
      
      <div className="space-y-6 relative z-10">
        {items.map((item) => (
          <div key={item.id} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-slate-700">{item.title}</span>
              <span className="font-mono text-slate-500">{item.progress}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000"
                style={{ width: `${item.progress}%` }}
              ></div>
            </div>
          </div>
        ))}
         {items.length === 0 && <p className="text-sm text-slate-400 italic">No live operations.</p>}
      </div>

      {/* Background Chart Effect */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none"></div>
    </div>
  )
}

// 4. TTE Schedule
export function TTESchedule({ items }: { items: JobSummary[] }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
          <Calendar className="w-5 h-5" />
        </div>
        <h3 className="font-heading font-bold text-slate-800">Schedule</h3>
      </div>
      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={item.id} className="flex gap-4 items-start relative">
             {/* Connector Line */}
            {idx !== items.length - 1 && (
              <div className="absolute left-[19px] top-8 bottom-[-16px] w-0.5 bg-slate-100"></div>
            )}
            
            <div className="flex-shrink-0 w-10 text-center">
              <p className="text-xs font-bold text-slate-500 uppercase">{new Date(item.date || '').toLocaleDateString('en-GB', { weekday: 'short' })}</p>
              <p className="text-lg font-bold text-slate-900">{new Date(item.date || '').getDate()}</p>
            </div>
            
            <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-100">
              <p className="text-sm font-medium text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{new Date(item.date || '').toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
          </div>
        ))}
         {items.length === 0 && <p className="text-sm text-slate-400 italic">Schedule clear.</p>}
      </div>
    </div>
  )
}

// 5. Urgent Tasks
export function UrgentTasks({ items }: { items: any[] }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-red-50 rounded-lg text-red-600">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h3 className="font-heading font-bold text-slate-800">Urgent Tasks</h3>
      </div>
      <div className="space-y-2">
         {/* Placeholder as no data source specified for tasks yet */}
         <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-800 font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            Approve Invoice #INV-2024
         </div>
         <div className="p-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 flex items-center gap-2">
            <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
            Review Site Photos
         </div>
      </div>
    </div>
  )
}

// 6. Financial Overview
export function FinancialOverview({ data }: { data: FinancialData }) {
  return (
    <div className="bg-slate-900 rounded-2xl p-6 shadow-lg text-white h-full relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-[60px] opacity-20 -mr-10 -mt-10"></div>
      
      <div className="flex items-center gap-2 mb-6 relative z-10">
        <div className="p-2 bg-slate-800 rounded-lg text-emerald-400">
          <DollarSign className="w-5 h-5" />
        </div>
        <h3 className="font-heading font-bold text-white">Financials</h3>
      </div>

      <div className="space-y-6 relative z-10">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Revenue (30d)</p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-mono font-bold text-emerald-400">{formatCurrency(data.revenue)}</h4>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        <div className="h-px bg-slate-800"></div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Burn</p>
            <h4 className="text-lg font-mono font-bold text-red-400">{formatCurrency(data.expenses)}</h4>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Retention</p>
            <h4 className="text-lg font-mono font-bold text-amber-400">{formatCurrency(data.retention)}</h4>
          </div>
        </div>
      </div>
    </div>
  )
}
