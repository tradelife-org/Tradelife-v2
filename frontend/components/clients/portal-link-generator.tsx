'use client'

import { useState } from 'react'
import { generatePortalLink } from '@/lib/actions/portal'
import { Link as LinkIcon, Check, Copy } from 'lucide-react'

export default function PortalLinkGenerator({ clientId }: { clientId: string }) {
  const [link, setLink] = useState<string | null>(null)
  const [expiry, setExpires] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    try {
      const result = await generatePortalLink(clientId)
      setLink(result.url)
      setExpires(result.expiresAt)
    } catch (err) {
      console.error(err)
      alert('Failed to generate link')
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    if (link) {
      navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mt-6">
      <h3 className="font-heading font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <LinkIcon className="w-5 h-5 text-slate-400" />
        Client Portal
      </h3>
      
      {!link ? (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-3 bg-blueprint-50 text-blueprint font-bold rounded-lg hover:bg-blueprint-100 transition-colors border border-blueprint-200"
        >
          {loading ? 'Generating...' : 'Generate Magic Link'}
        </button>
      ) : (
        <div className="space-y-3 animate-fade-in">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
            <code className="text-xs text-slate-600 truncate mr-2">{link}</code>
            <button 
              onClick={handleCopy}
              className="p-2 hover:bg-white rounded-md text-slate-500 hover:text-blueprint transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-slate-400 text-center">
            Expires {new Date(expiry!).toLocaleDateString()} at {new Date(expiry!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </p>
          <button
            onClick={() => setLink(null)}
            className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 font-medium"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  )
}
