'use client'

import { useState } from 'react'
import { GlassPanel } from '@/components/ui/glass-panel'
import { Check, CheckCircle, Circle, ShieldCheck } from 'lucide-react'
import { acceptQuoteAction } from '@/lib/actions/proposal'
import { useRouter } from 'next/navigation'

interface ProposalViewerProps {
  quote: any
  upsells: any[]
  token: string
  mockup_url?: string
}

export default function ProposalViewer({ quote, upsells, token, mockup_url }: ProposalViewerProps) {
  const router = useRouter()
  const [selectedUpsells, setSelectedUpsells] = useState<string[]>(
    upsells.filter(u => u.accepted).map(u => u.id)
  )
  const [accepting, setAccepting] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const formatPence = (p: number) => (p / 100).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })

  // Calculate Live Totals
  const baseNet = quote.quote_amount_net
  const vatRate = quote.vat_rate || 2000
  
  const upsellNet = upsells
    .filter(u => selectedUpsells.includes(u.id))
    .reduce((sum, u) => sum + u.price_total, 0)

  const totalNet = baseNet + upsellNet
  const totalVat = Math.round((totalNet * vatRate) / 10000)
  const totalGross = totalNet + totalVat

  function toggleUpsell(id: string) {
    if (selectedUpsells.includes(id)) {
      setSelectedUpsells(prev => prev.filter(uid => uid !== id))
    } else {
      setSelectedUpsells(prev => [...prev, id])
    }
  }

  async function handleAccept() {
    if (!agreed) return alert('Please agree to the terms.')
    setAccepting(true)
    try {
      await acceptQuoteAction(token, quote.id, selectedUpsells)
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setAccepting(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {mockup_url && (
        <div className="w-full aspect-[21/9] rounded-2xl overflow-hidden shadow-2xl border border-white/20 relative group">
          <img src={mockup_url} alt="Brand Mockup" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
            <p className="text-white font-heading font-bold text-xl drop-shadow-lg">Your Vision, Brought to Life</p>
          </div>
        </div>
      )}

      {/* Scope of Works */}
      <div className="space-y-6">
        <h2 className="text-2xl font-heading font-bold text-white mb-4">Scope of Works</h2>
        {quote.quote_sections?.sort((a: any, b: any) => a.sort_order - b.sort_order).map((section: any) => (
          <GlassPanel key={section.id} className="p-6 bg-white/10 text-white border-white/20">
            <h3 className="text-xl font-bold mb-2">{section.title}</h3>
            <p className="text-white/60 text-sm mb-4 uppercase tracking-wider">{section.trade_type}</p>
            
            {/* Description / Line Items */}
            <ul className="space-y-2">
              {section.quote_line_items?.map((item: any) => (
                <li key={item.id} className="flex items-start gap-3 text-sm text-white/90">
                  <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span>
                    {item.description}
                    {item.quantity > 1 && <span className="text-white/50 ml-1">x{item.quantity}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </GlassPanel>
        ))}
      </div>

      {/* Interactive Upsells */}
      {upsells.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-heading font-bold text-white mb-4">Recommended Upgrades</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upsells.map((upsell: any) => {
              const isSelected = selectedUpsells.includes(upsell.id)
              return (
                <div 
                  key={upsell.id}
                  onClick={() => toggleUpsell(upsell.id)}
                  className={`cursor-pointer p-4 rounded-xl border transition-all duration-200 
                    ${isSelected 
                      ? 'bg-blueprint-900/80 border-blueprint-500 shadow-[0_0_20px_rgba(0,71,171,0.3)]' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-white">{upsell.title}</h4>
                    {isSelected ? <CheckCircle className="w-5 h-5 text-blueprint-400" /> : <Circle className="w-5 h-5 text-slate-500" />}
                  </div>
                  <p className="text-xs text-white/60 mb-3">{upsell.description || 'Enhance your project with this premium option.'}</p>
                  <p className="font-mono font-bold text-safety-400">+ {formatPence(upsell.price_total)}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Terms & "Can You Just" */}
      <GlassPanel className="p-6 bg-slate-900/50 text-slate-300 text-sm border-white/10">
        <h3 className="font-bold text-white mb-2">Terms & Conditions</h3>
        <p className="mb-4">
          1. Payment is due within 7 days of invoice.<br/>
          2. Materials remain property of the contractor until paid in full.<br/>
          3. <strong className="text-white">"Can You Just" Clause:</strong> Any work requested outside the scope defined above will be treated as a Variation and quoted separately.
        </p>
        <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-white/5 transition-colors">
          <input 
            type="checkbox" 
            checked={agreed} 
            onChange={e => setAgreed(e.target.checked)}
            className="w-5 h-5 rounded border-slate-500 bg-slate-800 text-blueprint focus:ring-offset-0" 
          />
          <span className="font-medium text-white">I agree to the Scope of Works and Terms above.</span>
        </label>
      </GlassPanel>

      {/* Acceptance Sticky Bar */}
      <div className="sticky bottom-4">
        <GlassPanel className="p-4 bg-slate-900/90 border-slate-700/50 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Total Agreed Price (Inc VAT)</p>
            <p className="text-3xl font-mono font-bold text-white">{formatPence(totalGross)}</p>
          </div>
          <button
            onClick={handleAccept}
            disabled={!agreed || accepting}
            className="w-full sm:w-auto h-12 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {accepting ? 'Signing...' : (
              <>
                <ShieldCheck className="w-5 h-5" />
                Sign & Accept
              </>
            )}
          </button>
        </GlassPanel>
      </div>

    </div>
  )
}
