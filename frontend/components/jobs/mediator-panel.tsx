'use client'

import { useState } from 'react'
import { mediatorAction } from '@/lib/actions/communication'
import { GlassPanel } from '@/components/ui/glass-panel'
import { Scale, Loader2, MessageSquare, AlertCircle } from 'lucide-react'

export default function MediatorPanel({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  async function handleMediate() {
    setLoading(true)
    try {
      const data = await mediatorAction(jobId)
      setResult(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <GlassPanel className="p-6 bg-slate-900 text-white border-slate-700 shadow-xl">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-heading font-bold text-lg flex items-center gap-2">
            <Scale className="w-5 h-5 text-purple-400" />
            AI Mediator
          </h3>
          <p className="text-xs text-slate-400">Resolve disputes with data-backed neutrality.</p>
        </div>
        {!result && (
          <button 
            onClick={handleMediate}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Analyze Dispute'}
          </button>
        )}
      </div>

      {result && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-xs font-bold text-purple-400 uppercase mb-1">Analysis</p>
            <p className="text-sm text-slate-300">{result.analysis}</p>
          </div>
          
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-xs font-bold text-emerald-400 uppercase mb-1">Proposed Resolution</p>
            <p className="text-sm text-white font-medium">{result.resolution}</p>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-white/5">
            <span>Confidence: {(result.confidence * 100).toFixed(0)}%</span>
            <span>Recorded in Communication Log</span>
          </div>
        </div>
      )}
    </GlassPanel>
  )
}
