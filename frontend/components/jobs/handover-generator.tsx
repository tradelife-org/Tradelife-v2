'use client'

import * as React from 'react'
import { Rocket, Share2, ExternalLink, MapPin } from 'lucide-react'
import { GlassPanel } from '@/components/ui/glass-panel'
import { generateHandoverPack, updateJobUPRN } from '@/lib/actions/handover'

export default function HandoverGenerator({
  jobId,
  initialUPRN = '',
  existingToken = null
}: {
  jobId: string
  initialUPRN?: string
  existingToken?: string | null
}) {
  const [uprn, setUprn] = React.useState(initialUPRN)
  const [token, setToken] = React.useState(existingToken)
  const [isGenerating, setIsGenerating] = React.useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const result = await generateHandoverPack(jobId)
      if (result.success) setToken(result.token)
    } catch (err) {
      alert('Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUpdateUPRN = async () => {
    try {
      await updateJobUPRN(jobId, uprn)
    } catch (err) {
      alert('UPRN update failed')
    }
  }

  return (
    <GlassPanel className="p-6 bg-slate-900 text-white border-slate-800">
      <div className="flex flex-col md:flex-row gap-8 items-center">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blueprint/20 flex items-center justify-center">
              <Rocket className="w-6 h-6 text-blueprint" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-xl">Compliance Engine</h3>
              <p className="text-slate-400 text-xs">Generate a one-click Digital Handover Pack</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Property Registry (UPRN)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  value={uprn}
                  onChange={(e) => setUprn(e.target.value)}
                  placeholder="Enter UPRN (e.g. 100021678241)"
                  className="w-full bg-slate-800 border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-blueprint outline-none text-white"
                />
              </div>
              <button
                onClick={handleUpdateUPRN}
                className="h-10 px-4 rounded-lg border border-slate-700 hover:bg-slate-800 text-white text-sm font-medium transition-colors"
              >
                Link
              </button>
            </div>
          </div>
        </div>

        <div className="w-full md:w-auto flex flex-col gap-3">
          {!token ? (
            <button
              className="h-14 px-8 bg-blueprint hover:bg-blueprint/90 text-white font-bold rounded-xl shadow-lg shadow-blueprint/20 flex items-center justify-center transition-colors disabled:opacity-50"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              <Rocket className="w-5 h-5 mr-2" />
              {isGenerating ? 'Compiling Pack...' : 'Compile Handover Pack'}
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                className="h-10 px-4 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-white text-sm font-medium inline-flex items-center justify-center transition-colors"
                onClick={() => window.open(`/handover/${token}`, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Digital Pack
              </button>
              <button
                className="h-10 px-4 rounded-lg bg-blueprint text-white font-bold text-sm inline-flex items-center justify-center transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/handover/${token}`)
                  alert('Share link copied to clipboard')
                }}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share with Client
              </button>
            </div>
          )}
        </div>
      </div>
    </GlassPanel>
  )
}
