'use client'
import { supabase } from "@/lib/supabase/client"

import * as React from 'react'
import { Plus, Clock, CheckCircle, Loader2, Play } from 'lucide-react'
import { logSmallWorksAction, approveVariationAction } from '@/lib/actions/variations'
import { formatCurrency } from '@/lib/actions/quotes'
import { supabase } from '@/lib/supabase/client'

interface Variation {
  id: string
  description: string
  quantity: number
  unit: string
  line_total_net: number
  status: string
  created_at: string
}

export default function SmallWorksLogger({ jobId }: { jobId: string }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [minutes, setMinutes] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  
  const [variations, setVariations] = React.useState<Variation[]>([])
  
  // Real-time subscription or fetch on mount
  React.useEffect(() => {
    const fetchVariations = async () => {
      // supabase used
      const { data } = await supabase
        .from('variations')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false })
      if (data) setVariations(data as Variation[])
    }
    fetchVariations()
  }, [jobId, isOpen]) // Refetch when modal closes/submits

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!minutes) return
    setLoading(true)
    try {
      await logSmallWorksAction({
        jobId,
        minutes: parseInt(minutes),
        description
      })
      setIsOpen(false)
      setMinutes('')
      setDescription('')
    } catch (err) {
      console.error(err)
      alert('Failed to log time')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this variation? This will commit revenue.')) return
    try {
      await approveVariationAction(id)
      // Optimistic update
      setVariations(prev => prev.map(v => v.id === id ? { ...v, status: 'APPROVED' } : v))
    } catch (err) {
      alert('Approval failed')
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-heading font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blueprint" />
          Small Works / Variations
        </h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded-lg font-medium transition-colors"
        >
          {isOpen ? 'Cancel' : 'Log Time'}
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="mb-6 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Time Spent (Minutes)</label>
            <input
              type="number"
              value={minutes}
              onChange={e => setMinutes(e.target.value)}
              placeholder="e.g. 20"
              className="w-full p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blueprint/20 focus:border-blueprint"
              autoFocus
            />
            <p className="text-[10px] text-slate-400 mt-1">Rounds UP to nearest 15m block</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Fixed loose socket"
              className="w-full p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blueprint/20 focus:border-blueprint"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blueprint text-white text-xs font-bold rounded hover:bg-blueprint-700 disabled:opacity-50"
          >
            {loading ? 'Logging...' : 'Log Variation'}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {variations.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-2">No variations logged.</p>
        ) : (
          variations.map(v => (
            <div key={v.id} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded border border-transparent hover:border-slate-100 transition-all">
              <div>
                <p className="text-sm font-medium text-slate-900">{v.description}</p>
                <p className="text-xs text-slate-500">
                  {v.quantity} x {v.unit} · {formatCurrency(v.line_total_net)}
                </p>
              </div>
              <div>
                {v.status === 'PROPOSED' ? (
                  <button
                    onClick={() => handleApprove(v.id)}
                    className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 text-[10px] font-bold rounded border border-amber-200 transition-colors"
                  >
                    <Play className="w-3 h-3" /> Approve
                  </button>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded border border-green-200">
                    <CheckCircle className="w-3 h-3" /> Approved
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
