'use client'

import { useState } from 'react'
import { ocrAssetAction, saveAssetAction, AssetOCRData } from '@/lib/actions/assets'
import { Camera, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface WarrantySnapshotProps {
  jobId: string
  onSuccess?: () => void
}

export function WarrantySnapshot({ jobId, onSuccess }: WarrantySnapshotProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AssetOCRData | null>(null)
  const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'VERIFYING' | 'SAVED' | 'ERROR'>('IDLE')
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setStatus('SCANNING')
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const result = await ocrAssetAction(formData)
      setData(result)
      setStatus('VERIFYING')
    } catch (err) {
      console.error(err)
      setError('Failed to analyze document. Please try again or enter details manually.')
      setStatus('ERROR')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!data) return
    setLoading(true)
    try {
      await saveAssetAction(jobId, data)
      setStatus('SAVED')
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error(err)
      setError('Failed to save asset data.')
      setStatus('ERROR')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setData(null)
    setStatus('IDLE')
    setError(null)
  }

  if (status === 'SAVED') {
    return (
      <div className="bg-green-50 rounded-xl border border-green-200 p-4 shadow-sm text-center space-y-4">
        <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
        <div className="space-y-1">
          <h3 className="font-semibold text-lg text-green-900">Asset Registered!</h3>
          <p className="text-sm text-green-700">Maintenance reminders and warranty alerts have been auto-generated.</p>
        </div>
        <button
          onClick={handleReset}
          className="w-full py-2 px-4 bg-white border border-green-200 text-green-700 font-semibold rounded-lg hover:bg-green-100 transition-colors"
        >
          Snap Another
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
      <h3 className="text-sm font-heading font-bold text-slate-900 flex items-center gap-2">
        <Camera className="w-4 h-4 text-blueprint" />
        Warranty Snapshot
      </h3>

      <div className="space-y-4">
        {status === 'IDLE' || status === 'ERROR' ? (
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md flex items-start gap-2 text-sm border border-red-100">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center bg-slate-50 hover:bg-slate-100 transition-colors relative">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={loading}
              />
              <div className="space-y-2">
                <div className="bg-blueprint/10 w-10 h-10 rounded-full flex items-center justify-center mx-auto">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin text-blueprint" /> : <Camera className="w-5 h-5 text-blueprint" />}
                </div>
                <div>
                  <p className="font-medium text-slate-900 text-sm">Snap Data Plate</p>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-bold">OCR will extract manufacturer, model, and expiry.</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {status === 'VERIFYING' && data && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asset Type</label>
                <input
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blueprint"
                  value={data.asset_type}
                  onChange={(e) => setData({...data, asset_type: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Manufacturer</label>
                <input
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blueprint"
                  value={data.manufacturer || ''}
                  onChange={(e) => setData({...data, manufacturer: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Model</label>
                <input
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blueprint"
                  value={data.model || ''}
                  onChange={(e) => setData({...data, model: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Serial Number</label>
                <input
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blueprint"
                  value={data.serial_number || ''}
                  onChange={(e) => setData({...data, serial_number: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Install Date</label>
                <input
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blueprint"
                  type="date"
                  value={data.install_date || ''}
                  onChange={(e) => setData({...data, install_date: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Warranty Expiry</label>
                <input
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blueprint"
                  type="date"
                  value={data.warranty_expiry || ''}
                  onChange={(e) => setData({...data, warranty_expiry: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notes</label>
              <input
                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blueprint"
                value={data.notes || ''}
                onChange={(e) => setData({...data, notes: e.target.value})}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleReset}
                className="flex-1 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 py-1.5 bg-blueprint text-white text-xs font-semibold rounded hover:bg-blueprint-700 disabled:opacity-50 flex justify-center items-center gap-1"
              >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                Confirm & Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
