'use client'

import * as React from 'react'
import { calculateSection, calculateQuoteTotals } from '@/lib/actions/quotes'
import type { SectionData } from '@/components/quote-section-card'

/**
 * useQuoteCalculator — Client-side mirror of server pricing logic.
 * Provides optimistic real-time calculations as the user types.
 * Server remains the source of truth on final submission.
 */
export function useQuoteCalculator(vatRate: number = 2000) {
  const [sections, setSections] = React.useState<SectionData[]>(() => [
    createDefaultSection(),
  ])

  // Recalculate all sections whenever inputs change
  const calculatedSections = React.useMemo(() => {
    return sections.map((s) => {
      const calc = calculateSection({
        is_subcontract: s.is_subcontract,
        labour_days: s.labour_days,
        labour_day_rate: s.labour_day_rate,
        subcontract_cost: s.subcontract_cost,
        material_cost_total: s.material_cost_total,
        margin_percentage: s.margin_percentage,
      })
      return { ...s, ...calc }
    })
  }, [sections])

  // Calculate quote totals from sections
  const totals = React.useMemo(() => {
    const sectionCalcs = calculatedSections.map((s) => ({
      labour_cost: s.labour_cost,
      section_cost_total: s.section_cost_total,
      section_revenue_total: s.section_revenue_total,
      section_profit: s.section_profit,
    }))
    return calculateQuoteTotals({ sections: sectionCalcs, vat_rate: vatRate })
  }, [calculatedSections, vatRate])

  const addSection = React.useCallback(() => {
    setSections((prev) => [...prev, createDefaultSection()])
  }, [])

  const removeSection = React.useCallback((id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const updateSection = React.useCallback((id: string, field: string, value: any) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    )
  }, [])

  return {
    sections: calculatedSections,
    totals,
    addSection,
    removeSection,
    updateSection,
  }
}

function createDefaultSection(): SectionData {
  return {
    id: crypto.randomUUID(),
    title: '',
    trade_type: 'General',
    is_subcontract: false,
    labour_days: 0,
    labour_day_rate: 0,
    subcontract_cost: 0,
    material_cost_total: 0,
    margin_percentage: 2000, // 20% default
    // Calculated (will be overwritten)
    labour_cost: 0,
    section_cost_total: 0,
    section_revenue_total: 0,
    section_profit: 0,
  }
}
