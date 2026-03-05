'use client'

import { GlassPanel } from '@/components/ui/glass-panel'
import { CheckCircle, Circle, Hammer, Package } from 'lucide-react'

export default function JobMaterials({ materials }: { materials: any[] }) {
  const formatPence = (p: number) => (p / 100).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })

  if (materials.length === 0) return (
    <GlassPanel className="p-6 bg-slate-50 border-slate-200">
      <p className="text-sm text-slate-400 text-center italic">No materials tracked yet.</p>
    </GlassPanel>
  )

  return (
    <GlassPanel className="bg-white border-slate-200 overflow-hidden">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-heading font-bold text-slate-800 flex items-center gap-2">
          <Package className="w-5 h-5 text-amber-500" />
          Material Requirements
        </h3>
        <span className="text-xs font-bold bg-white border border-slate-200 px-2 py-1 rounded text-slate-500">
          {materials.length} Items
        </span>
      </div>
      
      <div className="divide-y divide-slate-100">
        {materials.map(item => (
          <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center 
                ${item.status === 'RECEIVED' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                {item.status === 'RECEIVED' ? <CheckCircle className="w-5 h-5" /> : <Package className="w-4 h-4" />}
              </div>
              <div>
                <p className="font-medium text-slate-900 text-sm">{item.description}</p>
                <div className="flex gap-3 text-xs text-slate-500 mt-0.5">
                  <span>Qty: {item.quantity} {item.unit}</span>
                  {item.supplier && <span>• Supplier: {item.supplier}</span>}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className="font-mono font-bold text-slate-700 text-sm">{formatPence(item.estimated_cost)}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider
                ${item.status === 'REQUIRED' ? 'bg-red-50 text-red-600' : 
                  item.status === 'ORDERED' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  )
}
