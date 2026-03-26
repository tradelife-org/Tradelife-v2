import { AlertTriangle, AlertCircle, ShieldCheck, Target } from 'lucide-react'

interface OutcomeLayer {
  outcome: { status: 'OK' | 'WARNING' | 'DANGEROUS'; requiredMargin: number; actualMargin: number; profit: number }
  projection: { totalRevenue: number; totalProfit: number; avgProfitPerJob: number }
  recommendation: { price: number }
}

interface ProfitSidebarProps {
  sections: any[]
  upsells: any[]
  quoteTotalCost: number
  quoteAmountNet: number
  marginPercentage: number
  marginFloor: number // 2000 = 20%
  outcomeLayer?: OutcomeLayer | null
  jobsPerMonth?: number | null
}

export default function StevensenProfitSidebar({
  sections,
  upsells,
  quoteTotalCost,
  quoteAmountNet,
  marginPercentage,
  marginFloor,
  outcomeLayer,
  jobsPerMonth
}: ProfitSidebarProps) {
  
  const formatPence = (p: number) => (p / 100).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })
  const marginPercent = marginPercentage / 100
  const isLowMargin = marginPercentage < marginFloor

  const breakdown = sections.reduce((acc, section) => {
    if (section.is_subcontract) {
      acc.subcontract += section.subcontract_cost
    } else {
      acc.labour += (section.labour_days * section.labour_day_rate)
    }
    acc.materials += section.material_cost_total
    return acc
  }, { materials: 0, labour: 0, subcontract: 0, other: 0 })

  const upsellCost = upsells.reduce((sum, u) => sum + (u.cost_total || 0), 0)
  breakdown.other += upsellCost

  const totalCost = breakdown.materials + breakdown.labour + breakdown.subcontract + breakdown.other
  const profit = quoteAmountNet - totalCost

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-6 sticky top-20 shadow-sm">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Profit Engine</h3>
          <p className="font-bold text-lg text-gray-900">Stevensen View</p>
        </div>
        <div className={`w-3 h-3 rounded-full ${isLowMargin ? 'bg-orange-500' : 'bg-emerald-500'}`} />
      </div>

      {/* Margin Alert */}
      {isLowMargin && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-orange-700 mb-0.5">Margin Alert</p>
            <p className="text-xs text-orange-600">
              Projected margin {marginPercent.toFixed(2)}% is below floor {(marginFloor/100).toFixed(0)}%.
            </p>
          </div>
        </div>
      )}

      {/* Big Numbers */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
          <p className="text-xs text-gray-500 uppercase">Net Revenue</p>
          <p className="text-lg font-mono font-bold text-gray-900">{formatPence(quoteAmountNet)}</p>
        </div>
        <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
          <p className="text-xs text-gray-500 uppercase">Est. Cost</p>
          <p className="text-lg font-mono font-bold text-gray-700">{formatPence(totalCost)}</p>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="space-y-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2">
          Cost Breakdown
        </p>
        <BreakdownRow label="Materials" amount={breakdown.materials} total={totalCost} color="bg-blue-500" />
        <BreakdownRow label="Labour" amount={breakdown.labour} total={totalCost} color="bg-amber-500" />
        <BreakdownRow label="Subcontract" amount={breakdown.subcontract} total={totalCost} color="bg-purple-500" />
        <BreakdownRow label="Other / Upsells" amount={breakdown.other} total={totalCost} color="bg-gray-400" />
      </div>

      {/* Quote Outcome */}
      {outcomeLayer && (
        <div className="space-y-3" data-testid="quote-outcome-block">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2">
            Quote Outcome
          </p>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-gray-400" />
            <span className={`text-sm font-bold ${
              outcomeLayer.outcome.status === 'OK' ? 'text-emerald-600' :
              outcomeLayer.outcome.status === 'WARNING' ? 'text-amber-600' :
              'text-red-600'
            }`} data-testid="outcome-status">
              {outcomeLayer.outcome.status}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <span className="text-gray-500">Required Margin</span>
            <span className="text-right font-mono text-gray-700" data-testid="required-margin">
              {(outcomeLayer.outcome.requiredMargin * 100).toFixed(2)}%
            </span>
            <span className="text-gray-500">Actual Margin</span>
            <span className="text-right font-mono text-gray-700" data-testid="actual-margin">
              {(outcomeLayer.outcome.actualMargin * 100).toFixed(2)}%
            </span>
          </div>
          {outcomeLayer.outcome.status !== 'OK' && (() => {
            const isWarning = outcomeLayer.outcome.status === 'WARNING'
            const isDangerous = outcomeLayer.outcome.status === 'DANGEROUS'
            const priceDiff = outcomeLayer.recommendation.price - quoteAmountNet
            return (
            <div className="space-y-3">
              {/* Status-specific message */}
              {isWarning && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3" data-testid="warning-message-block">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Below target margin</p>
                  <p className="text-xs text-amber-600 leading-relaxed">
                    You&apos;re below your target margin. This may reduce your long-term income.
                  </p>
                </div>
              )}
              {isDangerous && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3" data-testid="dangerous-message-block">
                  <p className="text-xs font-semibold text-red-700 mb-2">Unsustainable pricing</p>
                  <p className="text-xs text-red-600 leading-relaxed">
                    If you continue pricing like this:
                  </p>
                  <div className="mt-2 space-y-1 text-xs text-red-700">
                    <p data-testid="consequence-jobs">Over your next <span className="font-mono font-bold">{jobsPerMonth || 10}</span> jobs:</p>
                    <p data-testid="consequence-revenue">You will generate <span className="font-mono font-bold">{formatPence(outcomeLayer.projection.totalRevenue)}</span></p>
                    <p data-testid="consequence-profit">But only keep <span className="font-mono font-bold">{formatPence(outcomeLayer.projection.totalProfit)}</span></p>
                    <p className="pt-1 font-semibold" data-testid="consequence-per-job">
                      That&apos;s {formatPence(outcomeLayer.projection.avgProfitPerJob)} per job.
                    </p>
                  </div>
                </div>
              )}

              {/* Comparison line */}
              {priceDiff > 0 && (
                <p className="text-xs text-gray-600" data-testid="price-difference">
                  You are <span className="font-mono font-bold text-red-600">{formatPence(priceDiff)}</span> below recommended pricing
                </p>
              )}

              {/* Recommended price */}
              <p className="text-xs text-gray-500" data-testid="recommended-price">
                Recommended price: <span className="font-mono text-gray-900 font-medium">{formatPence(outcomeLayer.recommendation.price)}</span>
              </p>

              {/* Confirmation block — DANGEROUS only */}
              {isDangerous && (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mt-2" data-testid="confirmation-block">
                  <p className="text-sm font-bold text-red-800">
                    Are you sure you want to proceed at this price?
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Continuing at this rate will erode your margins and reduce your runway.
                  </p>
                </div>
              )}

              {/* Gap message */}
              {(() => {
                const requiredProfitPerJob = outcomeLayer.recommendation.price - quoteTotalCost
                const actualProfitPerJob = outcomeLayer.projection.avgProfitPerJob
                const gap = requiredProfitPerJob - actualProfitPerJob
                return gap > 0 ? (
                  <p className="text-xs text-gray-600" data-testid="gap-message">
                    You are <span className="font-mono font-bold text-red-600">{formatPence(gap)}</span> below what your business needs per job.
                  </p>
                ) : null
              })()}

              {/* Reality line — profit per day (assume 5-day job) */}
              {(() => {
                const avgProfit = outcomeLayer.projection.avgProfitPerJob
                const labourDays = sections.reduce((sum: number, s: any) => sum + (s.labour_days || 0), 0)
                const days = labourDays > 0 ? labourDays : 5
                const perDay = Math.round(avgProfit / days)
                return avgProfit > 0 && avgProfit < outcomeLayer.recommendation.price - quoteTotalCost ? (
                  <p className="text-xs text-gray-500" data-testid="reality-line">
                    You are effectively earning <span className="font-mono font-bold text-gray-900">{formatPence(perDay)}</span> per day on this job.
                  </p>
                ) : null
              })()}

              {/* Projection */}
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-1.5" data-testid="projection-block">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">If repeated (10 jobs):</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <span className="text-gray-500">Revenue</span>
                  <span className="text-right font-mono text-gray-700" data-testid="projection-revenue">{formatPence(outcomeLayer.projection.totalRevenue)}</span>
                  <span className="text-gray-500">Profit</span>
                  <span className="text-right font-mono text-gray-700" data-testid="projection-profit">{formatPence(outcomeLayer.projection.totalProfit)}</span>
                  <span className="text-gray-500">Avg profit/job</span>
                  <span className="text-right font-mono text-gray-700" data-testid="projection-avg-profit">{formatPence(outcomeLayer.projection.avgProfitPerJob)}</span>
                </div>
                {outcomeLayer.projection.avgProfitPerJob < outcomeLayer.outcome.profit && (
                  <p className="text-xs text-red-600 pt-1" data-testid="low-profit-warning">
                    You are working below your target level
                  </p>
                )}
              </div>
            </div>
            )
          })()}
        </div>
      )}

      {/* Net Profit Footer */}
      <div className="mt-auto pt-6 border-t border-gray-200">
        <div className="flex justify-between items-end mb-2">
          <p className="text-sm font-medium text-gray-500">Net Profit</p>
          <p className={`text-2xl font-mono font-bold ${profit > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatPence(profit)}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {profit > 0 ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
          <span>{marginPercent.toFixed(2)}% Margin calculated on Sell Price</span>
        </div>
      </div>
    </div>
  )
}

function BreakdownRow({ label, amount, total, color }: { label: string, amount: number, total: number, color: string }) {
  if (amount === 0) return null
  const percent = total > 0 ? (amount / total) * 100 : 0
  const formatPence = (p: number) => (p / 100).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-500">{'\u00A3'}{formatPence(amount)}</span>
      </div>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
