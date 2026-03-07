'use client'

import { useState } from 'react'
import { GlassPanel } from '@/components/ui/glass-panel'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { reportEmergencyAction } from '@/lib/actions/emergency'

export default function EmergencySOS({ token }: { token: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSOS() {
    if (!desc) return alert('Please describe the emergency')
    setLoading(true)
    try {
      const res = await reportEmergencyAction(token, desc)
      if (res.paymentUrl) {
        window.location.href = res.paymentUrl
      }
    } catch (err: any) {
      alert(err.message)
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
      >
        <AlertTriangle className="w-6 h-6 animate-pulse" />
        REPORT EMERGENCY
      </button>
    )
  }

  return (
    <GlassPanel className="p-6 bg-red-600 text-white border-red-500 shadow-2xl animate-slide-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-white/20 rounded-full animate-pulse">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="font-heading font-black text-xl">EMERGENCY DISPATCH</h3>
      </div>

      <p className="text-sm text-white/90 mb-4">
        We will dispatch a team immediately. An emergency call-out fee of <strong>£150.00</strong> applies.
      </p>

      <textarea
        value={desc}
        onChange={e => setDesc(e.target.value)}
        placeholder="Describe the issue (e.g. Burst pipe in kitchen)..."
        className="w-full h-24 p-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder:text-white/50 focus:ring-2 focus:ring-white mb-4"
        autoFocus
      />

      <div className="flex gap-3">
        <button 
          onClick={() => setIsOpen(false)}
          className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-colors"
        >
          Cancel
        </button>
        <button 
          onClick={handleSOS}
          disabled={loading}
          className="flex-[2] py-3 bg-white text-red-600 hover:bg-red-50 rounded-xl font-black shadow-lg flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'CONFIRM & PAY £150'}
        </button>
      </div>
    </GlassPanel>
  )
}
