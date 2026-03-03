'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PlusCircle, ArrowLeft, LogOut, Check } from 'lucide-react'
import { QuoteSectionCard } from '@/components/quote-section-card'
import { TotalsPanel } from '@/components/totals-panel'
import { useQuoteCalculator } from '@/hooks/use-quote-calculator'
import { saveQuoteDraft } from '@/lib/actions/save-quote'
import { createClient } from '@/lib/supabase/client'

const VAT_RATE = 2000 // 20.00%

export default function CreateQuotePage() {
  const router = useRouter()
  const { sections, totals, addSection, removeSection, updateSection } =
    useQuoteCalculator(VAT_RATE)

  const [saving, setSaving] = React.useState(false)
  const [saveResult, setSaveResult] = React.useState<{ success: boolean; message: string } | null>(null)
  const [userEmail, setUserEmail] = React.useState<string | null>(null)

  // Get current user on mount
  React.useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserEmail(user.email ?? null)
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaveResult(null)

    // Convert sections to save input — values are already in pence/x100 from the MoneyInput/PercentageInput
    const result = await saveQuoteDraft({
      vat_rate: VAT_RATE,
      sections: sections.map((s, idx) => ({
        title: s.title,
        trade_type: s.trade_type,
        sort_order: idx,
        is_subcontract: s.is_subcontract,
        labour_days: s.labour_days,
        labour_day_rate: s.labour_day_rate,
        subcontract_cost: s.subcontract_cost,
        material_cost_total: s.material_cost_total,
        margin_percentage: s.margin_percentage,
      })),
    })

    setSaving(false)
    if (result.success) {
      setSaveResult({ success: true, message: `Saved! Quote ID: ${result.quoteId?.slice(0, 8)}...` })
    } else {
      setSaveResult({ success: false, message: result.error || 'Save failed' })
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

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
          <div className="flex items-center gap-4">
            {userEmail && (
              <span className="hidden sm:block text-sm text-slate-400" data-testid="user-email">
                {userEmail}
              </span>
            )}
            <button
              onClick={handleSignOut}
              data-testid="signout-btn"
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <div className="font-heading font-black text-slate-200 text-lg tracking-tight select-none hidden sm:block">
              TradeLife<span className="text-blueprint">.</span>
            </div>
          </div>
        </div>
      </header>

      {/* Save Result Banner */}
      {saveResult && (
        <div
          className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-4`}
          data-testid="save-result-banner"
        >
          <div className={`p-3 rounded-lg flex items-center gap-2 text-sm font-medium ${
            saveResult.success
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {saveResult.success && <Check className="w-4 h-4" />}
            {saveResult.message}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Sections */}
          <div className="lg:col-span-8 space-y-6">
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
                onSave={handleSave}
                saving={saving}
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
              onClick={handleSave}
              disabled={saving}
              data-testid="mobile-save-btn"
              className="h-12 px-6 bg-safety text-white font-semibold rounded-xl text-sm disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
