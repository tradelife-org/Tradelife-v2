'use client'

import { useState } from 'react'
import { GlassPanel } from '@/components/ui/glass-panel'
import { VideoPlayer } from '@/components/ui/video-player'
import { CheckCircle, Circle, ArrowRight, ShieldCheck, Zap, FileText } from 'lucide-react'

export default function GuidesPage() {
  const [activeStep, setActiveStep] = useState(0)

  const steps = [
    { title: 'Connect Stripe', desc: 'Enable payments and payouts.', done: true },
    { title: 'Import Invoices', desc: 'Scan past jobs to detect assets.', done: false },
    { title: 'Set Profit Pots', desc: 'Configure your Profit First percentages.', done: false },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-slate-900 mb-2">Feature Setup Guides</h1>
        <p className="text-slate-500">Master the TradeLife Operating System.</p>
      </div>

      {/* Quick Start Checklist */}
      <GlassPanel className="p-8 bg-white border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          Quick Start Dashboard
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, idx) => (
            <div 
              key={idx} 
              className={`p-4 rounded-xl border transition-all ${step.done ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${step.done ? 'text-emerald-600' : 'text-slate-400'}`}>
                  Step {idx + 1}
                </span>
                {step.done ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-slate-300" />}
              </div>
              <h3 className={`font-bold ${step.done ? 'text-emerald-900' : 'text-slate-700'}`}>{step.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{step.desc}</p>
            </div>
          ))}
        </div>
      </GlassPanel>

      {/* Guides Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Wilson Portal Guide */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blueprint" />
            Wilson Portal & Payment Protect
          </h3>
          <VideoPlayer 
            title="Understanding Payment Protect" 
            summary="How funds are held securely at the platform level until job completion." 
          />
          <GlassPanel className="p-4 bg-white border-slate-200 text-sm text-slate-600">
            <p className="mb-2"><strong className="text-slate-900">Logic:</strong> Funds are captured via Stripe Connect.</p>
            <p><strong className="text-slate-900">Release:</strong> Only when you mark a Job as <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs font-bold">COMPLETED</span> does the transfer trigger.</p>
          </GlassPanel>
        </div>

        {/* Service Backfill Guide */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-500" />
            Service Backfill Traffic Lights
          </h3>
          <VideoPlayer 
            title="Automated Service Detection" 
            summary="Using AI to scan old invoices and populate your maintenance schedule." 
          />
          <GlassPanel className="p-4 bg-white border-slate-200">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
                <span className="text-sm font-bold text-slate-700">Green (Future)</span>
                <span className="text-xs text-slate-500">- Service due in 30+ days.</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-sm font-bold text-slate-700">Amber (Due Soon)</span>
                <span className="text-xs text-slate-500">- Due within 30 days. Book now.</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
                <span className="text-sm font-bold text-slate-700">Red (Overdue)</span>
                <span className="text-xs text-slate-500">- Immediate action required.</span>
              </div>
            </div>
          </GlassPanel>
        </div>

      </div>
    </div>
  )
}
