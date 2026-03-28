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
    <GlassPanel className="mx-auto max-w-xl border-white/10 bg-neutral-900/70 p-8" data-testid="payment-settings-panel">
      <div className="mb-6 flex items-center gap-4">
        <div className="rounded-xl bg-blue-500/15 p-3 text-blue-400">
          <CreditCard className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white" data-testid="payment-settings-title">Payout Settings</h2>
          <p className="text-sm text-neutral-400" data-testid="payment-settings-description">Connect Stripe to receive payments.</p>
        </div>
      </div>

      <button 
        onClick={handleConnect}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        data-testid="payment-settings-connect-button"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
          <>
            Setup Payouts
            <ArrowRight className="h-5 w-5" />
          </>
        )}
      </button>
    </GlassPanel>
  )
}
