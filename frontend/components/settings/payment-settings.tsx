'use client'

import { useState } from 'react'
import { createStripeConnectAccountLink } from '@/lib/actions/payouts'
import { GlassPanel } from '@/components/ui/glass-panel'
import { CreditCard, ArrowRight, Loader2 } from 'lucide-react'

export default function PaymentSettings() {
  const [loading, setLoading] = useState(false)

  async function handleConnect() {
    setLoading(true)
    try {
      const { url } = await createStripeConnectAccountLink()
      window.location.href = url
    } catch (err: any) {
      alert(err.message)
      setLoading(false)
    }
  }

  return (
    <GlassPanel className="p-8 bg-white border-slate-200 max-w-xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
          <CreditCard className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-heading font-bold text-slate-900">Payout Settings</h2>
          <p className="text-sm text-slate-500">Connect Stripe to receive payments.</p>
        </div>
      </div>

      <button 
        onClick={handleConnect}
        disabled={loading}
        className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
          <>
            Setup Payouts
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </GlassPanel>
  )
}
