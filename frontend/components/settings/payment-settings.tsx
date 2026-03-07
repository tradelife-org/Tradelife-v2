'use client'

import { useState } from 'react'
import { createStripeConnectAccountLink } from '@/lib/actions/payouts'
import { createFoundersBundleCheckout } from '@/lib/actions/stripe'
import { GlassPanel } from '@/components/ui/glass-panel'
import { CreditCard, ArrowRight, Loader2, Rocket } from 'lucide-react'

export default function PaymentSettings() {
  const [loading, setLoading] = useState(false)
  const [foundersLoading, setFoundersLoading] = useState(false)

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

  async function handleFoundersBundle() {
    setFoundersLoading(true)
    try {
      const { url } = await createFoundersBundleCheckout()
      window.location.href = url
    } catch (err: any) {
      alert(err.message)
      setFoundersLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
    <GlassPanel className="p-8 bg-white border-slate-200">
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

    <GlassPanel className="p-8 bg-gradient-to-br from-blueprint to-blueprint-800 text-white border-transparent">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-white/10 rounded-xl text-white">
          <Rocket className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-heading font-bold text-white">Founder's Bundle</h2>
          <p className="text-sm text-white/80">Full incorporation & brand setup.</p>
        </div>
      </div>

      <button
        onClick={handleFoundersBundle}
        disabled={foundersLoading}
        className="w-full py-4 bg-white text-blueprint font-bold rounded-xl hover:bg-white/90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-black/20"
      >
        {foundersLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
          <>
            Get the Bundle
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </GlassPanel>
    </div>
  )
}
