'use client'

import { useState } from 'react'
import { syncAccountingAction, approveScheduleAction, ignoreScheduleAction } from '@/lib/actions/intake'
import { GlassPanel } from '@/components/ui/glass-panel'
import { Loader2, Check, X, RefreshCw } from 'lucide-react'

export default function ImportReview({ schedules }: { schedules: any[] }) {
  const [loading, setLoading] = useState(false)

  async function handleSync() {
    setLoading(true)
    try {
      await syncAccountingAction()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-heading font-bold text-slate-900">Detected Installations</h2>
        <button 
          onClick={handleSync}
          disabled={loading}
          className="btn-secondary flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Scan Invoices
        </button>
      </div>

      <div className="space-y-4">
        {schedules.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            No pending imports found.
          </div>
        )}

        {schedules.map(item => (
          <GlassPanel key={item.id} className="p-4 bg-white border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-800">{item.title}</h4>
              <p className="text-xs text-slate-500">
                Found in Invoice from {new Date(item.created_at).toLocaleDateString()}
              </p>
              <div className="mt-2 text-sm text-slate-600">
                Scheduled for: <span className="font-mono font-bold text-blueprint">{new Date(item.next_due_date).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => ignoreScheduleAction(item.id)}
                className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                title="Ignore"
              >
                <X className="w-5 h-5" />
              </button>
              <button 
                onClick={() => approveScheduleAction(item.id)}
                className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                title="Approve"
              >
                <Check className="w-5 h-5" />
              </button>
            </div>
          </GlassPanel>
        ))}
      </div>
    </div>
  )
}
