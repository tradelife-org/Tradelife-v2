'use client'

import { useState } from 'react'
import { Plus, Trash2, CheckCircle, Circle, Tag } from 'lucide-react'
import { addUpsell, toggleUpsell, deleteUpsell } from '@/lib/actions/upsells'
import { GlassPanel } from '@/components/ui/glass-panel'

export default function UpsellManager({ quoteId, upsells }: { quoteId: string, upsells: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState({ title: '', price: '', cost: '' })
  const [loading, setLoading] = useState(false)

  const formatPence = (p: number) => (p / 100).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await addUpsell(quoteId, {
        title: form.title,
        price: Math.round(parseFloat(form.price) * 100),
        cost: Math.round(parseFloat(form.cost) * 100)
      })
      setForm({ title: '', price: '', cost: '' })
      setIsOpen(false)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle(id: string, current: boolean) {
    await toggleUpsell(id, !current)
  }

  return (
    <GlassPanel className="p-6 bg-white/60 border-white/40">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-heading font-bold text-slate-800 text-lg flex items-center gap-2">
          <Tag className="w-5 h-5 text-blueprint" />
          Recommended Upgrades
        </h3>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs font-bold text-blueprint uppercase hover:bg-blueprint-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          {isOpen ? 'Cancel' : '+ Add Upsell'}
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleAdd} className="mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-slide-in">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Upgrade Name</label>
              <input 
                required
                className="w-full h-9 px-2 text-sm border rounded mt-1" 
                value={form.title} 
                onChange={e => setForm({...form, title: e.target.value})}
                placeholder="e.g. Premium Brass Fittings"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Client Price (£)</label>
                <input 
                  required type="number" step="0.01"
                  className="w-full h-9 px-2 text-sm border rounded mt-1" 
                  value={form.price} 
                  onChange={e => setForm({...form, price: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Unit Cost (£)</label>
                <input 
                  type="number" step="0.01"
                  className="w-full h-9 px-2 text-sm border rounded mt-1 bg-slate-50" 
                  value={form.cost} 
                  onChange={e => setForm({...form, cost: e.target.value})}
                />
              </div>
            </div>
            <button 
              disabled={loading}
              className="w-full py-2 bg-blueprint text-white text-sm font-bold rounded-lg hover:bg-blueprint-700"
            >
              {loading ? 'Adding...' : 'Add Upgrade Option'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {upsells.length === 0 && !isOpen && (
          <p className="text-sm text-slate-400 italic">No upsells added yet.</p>
        )}
        
        {upsells.map(u => (
          <div key={u.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-blueprint/30 transition-all group">
            <div className="flex items-center gap-3">
              <button onClick={() => handleToggle(u.id, u.accepted)}>
                {u.accepted ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-slate-300" />}
              </button>
              <div>
                <p className={`font-semibold text-sm ${u.accepted ? 'text-slate-900' : 'text-slate-600'}`}>{u.title}</p>
                <p className="text-xs text-slate-400">Cost: {formatPence(u.cost_total)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono font-bold text-slate-700">{formatPence(u.price_total)}</p>
              <button 
                onClick={() => deleteUpsell(u.id)}
                className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  )
}
