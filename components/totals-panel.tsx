'use client'

import { TrendingUp, Receipt, PiggyBank, Percent } from 'lucide-react'

interface TotalsPanelProps {
  quoteCost: number      // pence
  quoteNet: number       // pence
  quoteProfit: number    // pence
  quoteMargin: number    // x100
  quoteGross: number     // pence
  vatRate: number        // x100
  sectionCount: number
}

export function TotalsPanel({
  quoteCost,
  quoteNet,
  quoteProfit,
  quoteMargin,
  quoteGross,
  vatRate,
  sectionCount,
}: TotalsPanelProps) {
  const fmt = (pence: number) =>
    (pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const fmtPct = (v: number) => (v / 100).toFixed(2)

  const vatAmount = quoteGross - quoteNet

  return (
    <div className="bg-slate-900 rounded-2xl overflow-hidden" data-testid="totals-panel">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-700">
        <h3 className="font-heading font-bold text-white text-lg">Quote Summary</h3>
        <p className="text-sm text-slate-400 mt-0.5">
          {sectionCount} section{sectionCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Metrics */}
      <div className="p-6 space-y-4">
        {/* Cost */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-400">Total Cost</span>
          </div>
          <span className="font-mono text-base text-slate-300" data-testid="total-cost">
            £{fmt(quoteCost)}
          </span>
        </div>

        {/* Net */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blueprint-200" />
            <span className="text-sm text-slate-400">Net Revenue</span>
          </div>
          <span className="font-mono text-base text-white" data-testid="total-net">
            £{fmt(quoteNet)}
          </span>
        </div>

        {/* Profit */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-4 h-4 text-green-400" />
            <span className="text-sm text-slate-400">Profit</span>
          </div>
          <span
            className={`font-mono text-base font-semibold ${quoteProfit > 0 ? 'text-green-400' : 'text-slate-500'}`}
            data-testid="total-profit"
          >
            £{fmt(quoteProfit)}
          </span>
        </div>

        {/* Margin */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-slate-400">Margin</span>
          </div>
          <span className="font-mono text-base text-amber-400" data-testid="total-margin">
            {fmtPct(quoteMargin)}%
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700 my-2" />

        {/* VAT */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">VAT ({fmtPct(vatRate)}%)</span>
          <span className="font-mono text-sm text-slate-400" data-testid="total-vat">
            £{fmt(vatAmount)}
          </span>
        </div>

        {/* Gross Total */}
        <div className="bg-blueprint rounded-xl p-4 -mx-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-blue-200">TOTAL (inc. VAT)</span>
            <span className="font-mono text-2xl font-bold text-white" data-testid="total-gross">
              £{fmt(quoteGross)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 pb-6 space-y-3">
        <button
          data-testid="save-quote-btn"
          className="w-full h-12 bg-safety text-white font-semibold rounded-xl hover:bg-safety-600 transition-colors duration-200 shadow-lg shadow-safety/25"
        >
          Save Draft
        </button>
      </div>
    </div>
  )
}
