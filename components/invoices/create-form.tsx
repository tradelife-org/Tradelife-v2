'use client'

import { useState, useEffect } from 'react'
import { createInvoiceAction } from '@/lib/actions/invoices'
import { GlassPanel } from '@/components/ui/glass-panel'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

export default function CreateInvoiceForm({ jobs }: { jobs: any[] }) {
  const searchParams = useSearchParams()
  const initialJobId = searchParams.get('jobId') || ''

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    jobId: initialJobId,
    type: 'DEPOSIT' as 'DEPOSIT' | 'INTERIM' | 'FINAL',
    depositPercentage: 25,
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await createInvoiceAction(formData)
    } catch (err: any) {
      alert(err.message)
      setLoading(false)
    }
  }

  const selectedJob = jobs.find(j => j.id === formData.jobId)

  return (
    <GlassPanel className="max-w-2xl mx-auto p-8 bg-white border-slate-200">
      <h2 className="text-2xl font-heading font-bold text-slate-900 mb-6">Create Invoice</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Select Job</label>
          <select 
            required
            className="w-full h-12 px-4 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blueprint"
            value={formData.jobId}
            onChange={e => setFormData({...formData, jobId: e.target.value})}
          >
            <option value="">Choose an active job...</option>
            {jobs.map(j => (
              <option key={j.id} value={j.id}>{j.title} ({j.clients?.name})</option>
            ))}
          </select>
        </div>

        {selectedJob && (
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
            Selected: <span className="font-bold">{selectedJob.title}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Invoice Type</label>
            <select 
              className="w-full h-12 px-4 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blueprint"
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value as any})}
            >
              <option value="DEPOSIT">Deposit</option>
              <option value="INTERIM">Interim</option>
              <option value="FINAL">Final</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Due Date</label>
            <input 
              type="date" required
              className="w-full h-12 px-4 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blueprint"
              value={formData.dueDate}
              onChange={e => setFormData({...formData, dueDate: e.target.value})}
            />
          </div>
        </div>

        {formData.type === 'DEPOSIT' && (
          <div className="space-y-4">
            <label className="block text-sm font-bold text-slate-700">Deposit Percentage</label>
            <div className="flex gap-4">
              {[25, 50, 75].map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setFormData({...formData, depositPercentage: pct})}
                  className={`flex-1 h-12 rounded-xl font-bold border transition-all
                    ${formData.depositPercentage === pct 
                      ? 'bg-blueprint text-white border-blueprint' 
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blueprint'}`}
                >
                  {pct}%
                </button>
              ))}
              <div className="relative flex-1">
                <input
                  type="number"
                  min="1" max="100"
                  className="w-full h-12 px-4 border rounded-xl bg-white text-center font-bold"
                  value={formData.depositPercentage}
                  onChange={e => setFormData({...formData, depositPercentage: parseInt(e.target.value) || 0})}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
              </div>
            </div>
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full h-14 bg-blueprint text-white font-bold rounded-xl hover:bg-blueprint-700 transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>
              Generate Invoice
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </GlassPanel>
  )
}
