'use client'

import { useState } from 'react'
import { syncXeroInvoicesAction } from '@/lib/actions/accounting'
import { Loader2, RefreshCw } from 'lucide-react'

export default function XeroSyncButton() {
  const [loading, setLoading] = useState(false)

  async function handleSync() {
    setLoading(true)
    try {
      const res = await syncXeroInvoicesAction()
      alert(`Sync Complete. Backfilled ${res.detected} jobs/services.`)
    } catch (err: any) {
      alert(`Sync Failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handleSync}
      disabled={loading}
      className="btn-secondary flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-xs font-bold text-slate-700"
    >
      <RefreshCw className={`w-4 h-4 text-blue-500 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Backfilling...' : 'Sync Xero History'}
    </button>
  )
}
