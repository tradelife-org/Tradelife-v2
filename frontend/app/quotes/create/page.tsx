'use client'

import * as React from 'react'
import Link from 'next/link'
import { PlusCircle, ArrowLeft } from 'lucide-react'
import { QuoteSectionCard } from '@/components/quote-section-card'
import { TotalsPanel } from '@/components/totals-panel'
import { useQuoteCalculator } from '@/hooks/use-quote-calculator'

const VAT_RATE = 2000 // 20.00%

export default function CreateQuotePage() {
  const { sections, totals, addSection, removeSection, updateSection } =
    useQuoteCalculator(VAT_RATE)

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              data-testid="back-link"
              className="p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-heading font-bold text-xl text-slate-900" data-testid="page-title">
                New Quote
              </h1>
              <p className="text-xs text-slate-400 font-body">Draft</p>
            </div>
          </div>
          <div className="font-heading font-black text-slate-200 text-lg tracking-tight select-none">
            TradeLife<span className="text-blueprint">.</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Sections */}
          <div className="lg:col-span-8 space-y-6">
            {/* Section Cards */}
            {sections.map((section, idx) => (
              <QuoteSectionCard
                key={section.id}
                section={section}
                index={idx}
                onUpdate={updateSection}
                onRemove={removeSection}
                canRemove={sections.length > 1}
              />
            ))}

            {/* Add Section Button */}
            <button
              onClick={addSection}
              data-testid="add-section-btn"
              className="w-full h-14 flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 font-semibold hover:border-blueprint hover:text-blueprint hover:bg-blueprint-50 transition-all duration-200"
            >
              <PlusCircle className="w-5 h-5" />
              Add Section
            </button>
          </div>

          {/* Right Column: Totals (Sticky on Desktop) */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <TotalsPanel
                quoteCost={totals.quote_total_cost}
                quoteNet={totals.quote_amount_net}
                quoteProfit={totals.quote_profit}
                quoteMargin={totals.quote_margin_percentage}
                quoteGross={totals.quote_amount_gross}
                vatRate={VAT_RATE}
                sectionCount={sections.length}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Fixed Bottom Summary */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700 px-4 py-3 safe-area-bottom">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Total (inc. VAT)</p>
            <p className="font-mono text-xl font-bold text-white" data-testid="mobile-total-gross">
              £{(totals.quote_amount_gross / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-400">Profit</p>
              <p className={`font-mono text-sm font-semibold ${totals.quote_profit > 0 ? 'text-green-400' : 'text-slate-500'}`}>
                £{(totals.quote_profit / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <button
              data-testid="mobile-save-btn"
              className="h-12 px-6 bg-safety text-white font-semibold rounded-xl text-sm"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
