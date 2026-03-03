'use client'

import * as React from 'react'
import { MoneyInput } from '@/components/ui/money-input'
import { PercentageInput } from '@/components/ui/percentage-input'
import {
  Trash2, ChevronDown, ChevronUp,
  Hammer, HardHat, Package, TrendingUp,
} from 'lucide-react'

// Trade type options
const TRADE_TYPES = [
  'General', 'Electrical', 'Plumbing', 'Carpentry', 'Plastering',
  'Painting', 'Roofing', 'Tiling', 'Flooring', 'Landscaping', 'Other',
]

export interface SectionData {
  id: string
  title: string
  trade_type: string
  is_subcontract: boolean
  labour_days: number
  labour_day_rate: number   // pence
  subcontract_cost: number  // pence
  material_cost_total: number // pence
  margin_percentage: number  // x100
  // Calculated (from hook)
  labour_cost: number
  section_cost_total: number
  section_revenue_total: number
  section_profit: number
}

interface QuoteSectionCardProps {
  section: SectionData
  index: number
  onUpdate: (id: string, field: string, value: any) => void
  onRemove: (id: string) => void
  canRemove: boolean
}

export function QuoteSectionCard({
  section,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: QuoteSectionCardProps) {
  const [collapsed, setCollapsed] = React.useState(false)

  const formatPence = (pence: number) => {
    const pounds = pence / 100
    return pounds.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <div
      className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-slide-in"
      data-testid={`quote-section-${index}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-slate-50 border-b border-slate-200">
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blueprint text-white font-heading font-bold text-sm shrink-0">
            {index + 1}
          </span>
          <input
            type="text"
            value={section.title}
            onChange={(e) => onUpdate(section.id, 'title', e.target.value)}
            placeholder="Section name (e.g. Kitchen Fit-out)"
            data-testid={`section-title-${index}`}
            className="flex-1 bg-transparent font-heading font-bold text-lg text-slate-900 placeholder:text-slate-300 focus:outline-none min-w-0"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            data-testid={`section-collapse-${index}`}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label={collapsed ? 'Expand section' : 'Collapse section'}
          >
            {collapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>
          {canRemove && (
            <button
              onClick={() => onRemove(section.id)}
              data-testid={`section-remove-${index}`}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              aria-label="Remove section"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Body (collapsible) */}
      {!collapsed && (
        <div className="p-5 space-y-5">
          {/* Trade Type + Subcontract Toggle */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-1.5">
              <label className="block text-sm font-medium text-slate-600">Trade Type</label>
              <select
                value={section.trade_type}
                onChange={(e) => onUpdate(section.id, 'trade_type', e.target.value)}
                data-testid={`section-trade-type-${index}`}
                className="w-full h-12 px-3 text-base bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint"
              >
                {TRADE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => onUpdate(section.id, 'is_subcontract', !section.is_subcontract)}
                data-testid={`section-subcontract-toggle-${index}`}
                className={`h-12 px-5 flex items-center gap-2 rounded-lg border text-sm font-semibold transition-all ${
                  section.is_subcontract
                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {section.is_subcontract ? (
                  <><HardHat className="w-4 h-4" /> Subcontract</>
                ) : (
                  <><Hammer className="w-4 h-4" /> Direct Labour</>
                )}
              </button>
            </div>
          </div>

          {/* Labour Inputs */}
          {section.is_subcontract ? (
            <div className="grid grid-cols-1 gap-4">
              <MoneyInput
                label="Subcontract Cost"
                value={section.subcontract_cost}
                onChange={(v) => onUpdate(section.id, 'subcontract_cost', v)}
                data-testid={`section-subcontract-cost-${index}`}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-600">Labour Days</label>
                <input
                  type="number"
                  min={0}
                  value={section.labour_days || ''}
                  onChange={(e) => {
                    const v = parseInt(e.target.value) || 0
                    onUpdate(section.id, 'labour_days', Math.max(0, v))
                  }}
                  data-testid={`section-labour-days-${index}`}
                  className="w-full h-12 px-3 text-right font-mono text-base bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint"
                  placeholder="0"
                />
              </div>
              <MoneyInput
                label="Day Rate"
                value={section.labour_day_rate}
                onChange={(v) => onUpdate(section.id, 'labour_day_rate', v)}
                data-testid={`section-day-rate-${index}`}
              />
            </div>
          )}

          {/* Materials + Margin */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-end">
              <div className="w-full">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Package className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-sm font-medium text-slate-600">Materials</span>
                </div>
                <MoneyInput
                  value={section.material_cost_total}
                  onChange={(v) => onUpdate(section.id, 'material_cost_total', v)}
                  data-testid={`section-materials-${index}`}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-sm font-medium text-slate-600">Margin</span>
              </div>
              <PercentageInput
                value={section.margin_percentage}
                onChange={(v) => onUpdate(section.id, 'margin_percentage', v)}
                data-testid={`section-margin-${index}`}
              />
            </div>
          </div>

          {/* Section Summary */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-dashed border-slate-200">
            <div className="text-center p-3 rounded-lg bg-slate-50">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Cost</p>
              <p className="text-lg font-mono font-semibold text-slate-700" data-testid={`section-cost-display-${index}`}>
                £{formatPence(section.section_cost_total)}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-50">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Revenue</p>
              <p className="text-lg font-mono font-semibold text-blueprint" data-testid={`section-revenue-display-${index}`}>
                £{formatPence(section.section_revenue_total)}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-50">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Profit</p>
              <p
                className={`text-lg font-mono font-semibold ${section.section_profit > 0 ? 'text-green-600' : 'text-slate-400'}`}
                data-testid={`section-profit-display-${index}`}
              >
                £{formatPence(section.section_profit)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
