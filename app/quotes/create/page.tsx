'use client'

import * as React from 'react'
import Link from 'next/link'
import { PlusCircle, ArrowLeft, Check, BookOpen } from 'lucide-react'
import { QuoteSectionCard } from '@/components/quote-section-card'
import { TotalsPanel } from '@/components/totals-panel'
import { useQuoteCalculator } from '@/hooks/use-quote-calculator'
import { saveQuoteDraft } from '@/lib/actions/save-quote'
import { supabase } from '@/lib/supabase/client'

const VAT_RATE = 2000

interface Template {
  id: string
  name: string
  trade_type: string
  is_subcontract: boolean
  labour_days: number
  labour_day_rate: number
  subcontract_cost: number
  material_cost_total: number
  margin_percentage: number
}

export default function CreateQuotePage() {
  const { sections, totals, addSection, removeSection, updateSection, importTemplate } =
    useQuoteCalculator(VAT_RATE)

  const [saving, setSaving] = React.useState(false)
  const [saveResult, setSaveResult] = React.useState<{ success: boolean; message: string } | null>(null)
  const [templates, setTemplates] = React.useState<Template[]>([])
  const [showTemplates, setShowTemplates] = React.useState(false)
  const templateRef = React.useRef<HTMLDivElement>(null)

  // Load templates on mount (direct Supabase client - no server action)
  React.useEffect(() => {
    async function fetchTemplates() {
      try {
        // const supabase = createClient()
        const { data } = await supabase
          .from('quote_templates')
          .select('*')
          .order('created_at', { ascending: false })
        if (data) setTemplates(data)
      } catch {
        // Table may not exist yet
      }
    }
    fetchTemplates()
  }, [])

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (templateRef.current && !templateRef.current.contains(e.target as Node)) {
        setShowTemplates(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaveResult(null)

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
      // Refresh templates
      // const supabase = createClient()
      const { data } = await supabase.from('quote_templates').select('*').order('created_at', { ascending: false })
      if (data) setTemplates(data)
    } else {
      setSaveResult({ success: false, message: result.error || 'Save failed' })
    }
  }

  const handleImportTemplate = (template: Template) => {
    importTemplate(template)
    setShowTemplates(false)
  }

  const formatPence = (pence: number) =>
    (pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/quotes"
            data-testid="back-to-quotes"
            className="p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-heading font-bold text-2xl text-slate-900" data-testid="page-title">
              New Quote
            </h1>
            <p className="text-xs text-slate-400 font-body">Draft</p>
          </div>
        </div>
      </div>

      {/* Save Result Banner */}
      {saveResult && (
        <div className="mb-6" data-testid="save-result-banner">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Sections */}
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

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={addSection}
              data-testid="add-section-btn"
              className="flex-1 h-14 flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 font-semibold hover:border-blueprint hover:text-blueprint hover:bg-blueprint-50 transition-all duration-200"
            >
              <PlusCircle className="w-5 h-5" />
              Add Section
            </button>

            {/* Import Template Button */}
            <div className="relative" ref={templateRef}>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                data-testid="import-template-btn"
                className="h-14 px-6 flex items-center gap-2 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 font-semibold hover:border-safety hover:text-safety hover:bg-safety-50 transition-all duration-200 whitespace-nowrap"
              >
                <BookOpen className="w-5 h-5" />
                Import Template
              </button>

              {/* Template Dropdown */}
              {showTemplates && (
                <div className="absolute top-full mt-2 left-0 w-72 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-slide-in" data-testid="template-dropdown">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saved Templates</p>
                  </div>
                  {templates.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-slate-400">No templates yet</p>
                      <p className="text-xs text-slate-300 mt-1">Save a section to create your first template</p>
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      {templates.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => handleImportTemplate(t)}
                          data-testid={`template-option-${t.id}`}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors"
                        >
                          <p className="font-semibold text-sm text-slate-900">{t.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {t.trade_type} · {t.is_subcontract ? 'Sub' : `${t.labour_days}d`} · {(t.margin_percentage / 100).toFixed(0)}% margin
                            {t.material_cost_total > 0 && ` · £${formatPence(t.material_cost_total)} materials`}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Totals */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-20">
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

      {/* Mobile Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Total (inc. VAT)</p>
            <p className="font-mono text-xl font-bold text-white" data-testid="mobile-total-gross">
              £{formatPence(totals.quote_amount_gross)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-400">Profit</p>
              <p className={`font-mono text-sm font-semibold ${totals.quote_profit > 0 ? 'text-green-400' : 'text-slate-500'}`}>
                £{formatPence(totals.quote_profit)}
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
