// ============================================================================
// TradeLife v2 - Pricing Engine
// /app/lib/actions/quotes.ts
//
// Pure Server-side pricing logic. ALL math happens here, never on the client.
// This file is SAFE to import in client components as it has no side effects.
//
// CURRENCY CONVENTION:
//   All monetary values are BIGINT stored as pence/cents (integer).
//   Percentages are stored as integer x100 (e.g., 2500 = 25.00%).
//   This eliminates floating-point rounding errors entirely.
// ============================================================================

import type { QuoteSection, Quote } from '../types/database';

// ============================================================================
// SECTION-LEVEL CALCULATIONS
// ============================================================================

export interface SectionInput {
  is_subcontract: boolean;
  labour_days: number;
  labour_day_rate: number;       // pence per day
  subcontract_cost: number;      // pence
  material_cost_total: number;   // pence
  margin_percentage: number;     // x100 (2500 = 25.00%)
}

export interface SectionCalculation {
  labour_cost: number;
  section_cost_total: number;
  section_revenue_total: number;
  section_profit: number;
}

export function calculateSection(input: SectionInput): SectionCalculation {
  const labour_cost = input.is_subcontract
    ? input.subcontract_cost
    : input.labour_days * input.labour_day_rate;

  const section_cost_total = labour_cost + input.material_cost_total;

  const margin_amount = Math.round(
    (section_cost_total * input.margin_percentage) / 10000
  );
  const section_revenue_total = section_cost_total + margin_amount;

  const section_profit = section_revenue_total - section_cost_total;

  return {
    labour_cost,
    section_cost_total,
    section_revenue_total,
    section_profit,
  };
}

// ============================================================================
// QUOTE-LEVEL CALCULATIONS
// ============================================================================

export interface QuoteTotalInput {
  sections: SectionCalculation[];
  vat_rate: number;  // x100 (2000 = 20.00%)
}

export interface QuoteTotalCalculation {
  quote_amount_net: number;
  quote_amount_gross: number;
  quote_total_cost: number;
  quote_profit: number;
  quote_margin_percentage: number;  // x100
}

export function calculateQuoteTotals(input: QuoteTotalInput): QuoteTotalCalculation {
  const quote_amount_net = input.sections.reduce(
    (sum, s) => sum + s.section_revenue_total, 0
  );

  const quote_total_cost = input.sections.reduce(
    (sum, s) => sum + s.section_cost_total, 0
  );

  const quote_profit = quote_amount_net - quote_total_cost;

  const quote_margin_percentage = quote_total_cost > 0
    ? Math.round((quote_profit * 10000) / quote_total_cost)
    : 0;

  const quote_amount_gross = Math.round(
    (quote_amount_net * (10000 + input.vat_rate)) / 10000
  );

  return {
    quote_amount_net,
    quote_amount_gross,
    quote_total_cost,
    quote_profit,
    quote_margin_percentage,
  };
}

// ============================================================================
// LINE ITEM CALCULATION
// ============================================================================

export function calculateLineTotal(quantity: number, unit_price_net: number): number {
  return quantity * unit_price_net;
}

// ============================================================================
// VARIATION CALCULATION
// ============================================================================

export function calculateVariationTotal(quantity: number, unit_price_net: number): number {
  return quantity * unit_price_net;
}

// ============================================================================
// DISPLAY HELPERS (pence -> formatted string)
// These are the ONLY place where division happens.
// ============================================================================

export function penceToPounds(pence: number): string {
  return (pence / 100).toFixed(2);
}

export function formatCurrency(pence: number, symbol: string = '£'): string {
  const pounds = pence / 100;
  return `${symbol}${pounds.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPercentage(value: number): string {
  return `${(value / 100).toFixed(2)}%`;
}

export function poundsToPence(pounds: number): number {
  return Math.round(pounds * 100);
}

export function percentageToStored(percentage: number): number {
  return Math.round(percentage * 100);
}

// ============================================================================
// FULL QUOTE RECALCULATION
// Orchestrates the complete recalculation of a quote from raw section inputs.
// ============================================================================

export interface FullQuoteRecalcInput {
  vat_rate: number;  // x100
  sections: SectionInput[];
}

export interface FullQuoteRecalcResult {
  sections: SectionCalculation[];
  totals: QuoteTotalCalculation;
}

export function recalculateQuote(input: FullQuoteRecalcInput): FullQuoteRecalcResult {
  const sections = input.sections.map(calculateSection);

  const totals = calculateQuoteTotals({
    sections,
    vat_rate: input.vat_rate,
  });

  return { sections, totals };
}
