'use client'

import * as React from 'react'
import { Settings, Hammer, Shield } from 'lucide-react'
import { GlassPanel } from '@/components/ui/glass-panel'

interface PropertyAsset {
  id: string
  name: string
  manufacturer: string | null
  model: string | null
  serial_number: string | null
  warranty_expiry: string | null
}

export default function PropertyAssetList({
  jobId,
  clientId,
  initialAssets = []
}: {
  jobId: string
  clientId: string
  initialAssets?: PropertyAsset[]
}) {
  const [assets, setAssets] = React.useState(initialAssets)

  return (
    <GlassPanel className="p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h3 className="font-heading font-bold text-slate-900 flex items-center gap-2">
          <Hammer className="w-5 h-5 text-blueprint" />
          Property Assets
        </h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-wider">
          Sale Ready Data
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assets.map(asset => (
          <div key={asset.id} className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-slate-800">{asset.name}</h4>
              <div className="p-1.5 rounded-lg bg-slate-50">
                <Settings className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-2 text-[11px]">
              <div className="text-slate-400 uppercase font-semibold">Manufacturer</div>
              <div className="text-slate-700 font-medium">{asset.manufacturer || '—'}</div>

              <div className="text-slate-400 uppercase font-semibold">Model / Serial</div>
              <div className="text-slate-700 font-medium">{asset.model || asset.serial_number || '—'}</div>

              <div className="text-slate-400 uppercase font-semibold">Warranty Expiry</div>
              <div className="text-blueprint font-bold flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {asset.warranty_expiry ? new Date(asset.warranty_expiry).toLocaleDateString() : 'No data'}
              </div>
            </div>
          </div>
        ))}

        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2">
            <Hammer className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-xs font-bold text-slate-500">Register New Asset</p>
          <p className="text-[10px] text-slate-400">Add boilers, consumer units, etc.</p>
        </div>
      </div>
    </GlassPanel>
  )
}
