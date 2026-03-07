import { GlassPanel } from '@/components/ui/glass-panel'
import { AlertTriangle, TrendingUp, AlertCircle, ShieldCheck } from 'lucide-react'

interface ProfitSidebarProps {
  sections: any[]
  upsells: any[]
  quoteTotalCost: number
  quoteAmountNet: number
  marginPercentage: number
  marginFloor: number // 2000 = 20%
}

export default function StevensenProfitSidebar({
  sections,
  upsells,
  quoteTotalCost,
  quoteAmountNet,
  marginPercentage,
  marginFloor
}: ProfitSidebarProps) {
  
  const formatPence = (p: number) => (p / 100).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })
  const marginPercent = marginPercentage / 100
  const isLowMargin = marginPercentage < marginFloor

  // Breakdown Calculation
  const breakdown = sections.reduce((acc, section) => {
    if (section.is_subcontract) {
      acc.subcontract += section.subcontract_cost
    } else {
      acc.labour += (section.labour_days * section.labour_day_rate)
    }
    acc.materials += section.material_cost_total
    return acc
  }, { materials: 0, labour: 0, subcontract: 0, other: 0 })

  // Add upsell costs if any (assuming they are material/other mix, putting in Other for now)
  const upsellCost = upsells.reduce((sum, u) => sum + (u.cost_total || 0), 0)
  breakdown.other += upsellCost

  const totalCost = breakdown.materials + breakdown.labour + breakdown.subcontract + breakdown.other
  const profit = quoteAmountNet - totalCost

  return (
    <GlassPanel className="h-full bg-slate-900 text-white border-slate-700 shadow-2xl backdrop-blur-xl p-6 flex flex-col gap-6 sticky top-8">
      
      {/* Header & Orb */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Profit Engine</h3>
          <p className="font-heading font-bold text-xl">Stevensen View</p>
        </div>
        
        {/* T-Pulse Orb */}
        <div className="relative">
          <div className={`w-4 h-4 rounded-full transition-all duration-500 
            ${isLowMargin ? 'bg-safety animate-pulse shadow-[0_0_15px_rgba(255,95,0,0.6)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]'}`} 
          />
          {isLowMargin && (
            <div className="absolute top-0 right-0 w-4 h-4 rounded-full bg-safety animate-ping opacity-75" />
          )}
        </div>
      </div>

      {/* Margin Guardrail Alert */}
      {isLowMargin && (
        <div className="bg-safety/10 border border-safety/30 rounded-lg p-3 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-safety shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-safety mb-0.5">Margin Alert</p>
            <p className="text-xs text-white/80">
              Projected margin {marginPercent.toFixed(2)}% is below floor {(marginFloor/100).toFixed(0)}%.
            </p>
          </div>
        </div>
      )}

      {/* Financial Big Numbers */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-xs text-slate-400 uppercase">Net Revenue</p>
          <p className="text-lg font-mono font-bold text-white">{formatPence(quoteAmountNet)}</p>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-xs text-slate-400 uppercase">Est. Cost</p>
          <p className="text-lg font-mono font-bold text-slate-300">{formatPence(totalCost)}</p>
        </div>
      </div>

      {/* The Breakdown */}
      <div className="space-y-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-700 pb-2">
          Cost Breakdown
        </p>
        
        <BreakdownRow label="Materials" amount={breakdown.materials} total={totalCost} color="bg-blue-500" />
        <BreakdownRow label="Labour" amount={breakdown.labour} total={totalCost} color="bg-amber-500" />
        <BreakdownRow label="Subcontract" amount={breakdown.subcontract} total={totalCost} color="bg-purple-500" />
        <BreakdownRow label="Other / Upsells" amount={breakdown.other} total={totalCost} color="bg-slate-500" />
      </div>

      <div className="mt-auto pt-6 border-t border-slate-700">
        <div className="flex justify-between items-end mb-2">
          <p className="text-sm font-medium text-slate-400">Net Profit</p>
          <p className={`text-2xl font-mono font-bold ${profit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatPence(profit)}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {profit > 0 ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
          <span>{marginPercent.toFixed(2)}% Margin calculated on Sell Price</span>
        </div>
      </div>

    </GlassPanel>
  )
}

function BreakdownRow({ label, amount, total, color }: { label: string, amount: number, total: number, color: string }) {
  if (amount === 0) return null
  const percent = total > 0 ? (amount / total) * 100 : 0
  const formatPence = (p: number) => (p / 100).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400">£{formatPence(amount)}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
