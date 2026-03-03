// ============================================================================
// TradeLife v2 - Pricing Engine
// /app/lib/actions/quotes.ts
//
// Server-side pricing logic. ALL math happens here, never on the client.
// 
// CURRENCY CONVENTION:
//   All monetary values are BIGINT stored as pence/cents (integer).
//   Percentages are stored as integer x100 (e.g., 2500 = 25.00%).
//   This eliminates floating-point rounding errors entirely.
//
// FORMULAS:
//   Direct Labour Cost = labour_days * labour_day_rate  (both integers, result in pence)
//   Subcontract Cost   = subcontract_cost               (already in pence)
//   Section Cost       = Labour Cost + Material Cost
//   Section Revenue    = Cost + (Cost * margin_percentage / 10000)
//   Section Profit     = Revenue - Cost
//   Quote Net          = Sum of all Section Revenues
//   Quote Cost         = Sum of all Section Costs
//   Quote Profit       = Quote Net - Quote Cost
//   Quote Gross        = Round(Net * (10000 + vat_rate) / 10000)
//
// NOTE ON INTEGER MATH:
//   margin_percentage is stored as x100 (2500 = 25.00%)
//   vat_rate is stored as x100 (2000 = 20.00%)
//   To apply: value * percentage / 10000
//   This gives us 2 decimal places of precision within integer math.
// ============================================================================

import type { QuoteSection, Quote } from '../types/database';

// ============================================================================
// SECTION-LEVEL CALCULATIONS
// ============================================================================

/**
 * Input shape for calculating a quote section.
 * All monetary values in pence. Percentages as x100 integers.
 */
export interface SectionInput {
  is_subcontract: boolean;
  // Direct labour (used when is_subcontract = false)
  labour_days: number;
  labour_day_rate: number;       // pence per day
  // Subcontract (used when is_subcontract = true)
  subcontract_cost: number;      // pence
  // Common
  material_cost_total: number;   // pence
  margin_percentage: number;     // x100 (2500 = 25.00%)
}

/**
 * Calculated output for a quote section.
 * All values in pence (integers).
 */
export interface SectionCalculation {
  labour_cost: number;
  section_cost_total: number;
  section_revenue_total: number;
  section_profit: number;
}

/**
 * Calculate section-level costs, revenue, and profit.
 * 
 * RULES:
 * - Direct Labour: Cost = Days × Day Rate + Materials
 * - Subcontract:   Cost = Subcontract Price + Materials
 * - Revenue:       Cost + (Cost × Margin% / 10000)
 * - Profit:        Revenue - Cost
 * 
 * All intermediate values stay as integers. No floating point.
 */
export function calculateSection(input: SectionInput): SectionCalculation {
  // Step 1: Calculate labour cost
  const labour_cost = input.is_subcontract
    ? input.subcontract_cost
    : input.labour_days * input.labour_day_rate;

  // Step 2: Total cost = labour + materials
  const section_cost_total = labour_cost + input.material_cost_total;

  // Step 3: Revenue = Cost + Margin
  // margin_percentage is x100, so divide by 10000 to get the multiplier
  // Use Math.round to handle any integer division remainder
  const margin_amount = Math.round(
    (section_cost_total * input.margin_percentage) / 10000
  );
  const section_revenue_total = section_cost_total + margin_amount;

  // Step 4: Profit = Revenue - Cost
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

/**
 * Input for calculating quote totals from an array of section results.
 */
export interface QuoteTotalInput {
  sections: SectionCalculation[];
  vat_rate: number;  // x100 (2000 = 20.00%)
}

/**
 * Calculated quote-level totals. All in pence.
 */
export interface QuoteTotalCalculation {
  quote_amount_net: number;
  quote_amount_gross: number;
  quote_total_cost: number;
  quote_profit: number;
  quote_margin_percentage: number;  // x100
}

/**
 * Calculate quote-level totals by aggregating all sections.
 * 
 * RULES:
 * - Net = Sum of all section revenues
 * - Cost = Sum of all section costs
 * - Profit = Net - Cost
 * - Margin% = (Profit / Cost) * 10000  (as x100 integer)
 * - Gross = Round(Net × (10000 + VAT Rate) / 10000)
 * 
 * VAT is ALWAYS applied at the very end, on the total Net amount.
 */
export function calculateQuoteTotals(input: QuoteTotalInput): QuoteTotalCalculation {
  // Step 1: Aggregate section values
  const quote_amount_net = input.sections.reduce(
    (sum, s) => sum + s.section_revenue_total, 0
  );

  const quote_total_cost = input.sections.reduce(
    (sum, s) => sum + s.section_cost_total, 0
  );

  // Step 2: Profit
  const quote_profit = quote_amount_net - quote_total_cost;

  // Step 3: Overall margin percentage
  // Margin% = (Profit / Cost) × 10000, guarded against division by zero
  const quote_margin_percentage = quote_total_cost > 0
    ? Math.round((quote_profit * 10000) / quote_total_cost)
    : 0;

  // Step 4: Apply VAT at the end
  // Gross = Net × (1 + VAT/10000) = Net × (10000 + VAT) / 10000
  // Use Math.round for the final pence value
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

/**
 * Calculate line total from quantity and unit price.
 * Simple: total = quantity × unit_price_net
 * Both are integers, result stays integer (pence).
 */
export function calculateLineTotal(quantity: number, unit_price_net: number): number {
  return quantity * unit_price_net;
}

// ============================================================================
// VARIATION CALCULATION
// ============================================================================

/**
 * Calculate variation line total.
 * Same as line item: total = quantity × unit_price_net
 */
export function calculateVariationTotal(quantity: number, unit_price_net: number): number {
  return quantity * unit_price_net;
}

// ============================================================================
// DISPLAY HELPERS (pence -> formatted string)
// These are the ONLY place where division happens.
// ============================================================================

/**
 * Convert pence (integer) to display string with 2 decimal places.
 * Example: 15050 -> "150.50"
 */
export function penceToPounds(pence: number): string {
  return (pence / 100).toFixed(2);
}

/**
 * Convert pence to a formatted currency string.
 * Example: 15050 -> "£150.50"
 */
export function formatCurrency(pence: number, symbol: string = '£'): string {
  const pounds = pence / 100;
  return `${symbol}${pounds.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Convert percentage stored as x100 integer to display string.
 * Example: 2500 -> "25.00%"
 */
export function formatPercentage(value: number): string {
  return `${(value / 100).toFixed(2)}%`;
}

/**
 * Convert a user-entered pounds value to pence for storage.
 * Example: "150.50" -> 15050
 * Rounds to nearest pence to handle floating-point input.
 */
export function poundsToPence(pounds: number): number {
  return Math.round(pounds * 100);
}

/**
 * Convert a user-entered percentage to x100 integer for storage.
 * Example: 25.5 -> 2550
 */
export function percentageToStored(percentage: number): number {
  return Math.round(percentage * 100);
}

// ============================================================================
// FULL QUOTE RECALCULATION
// Orchestrates the complete recalculation of a quote from raw section inputs.
// This is the primary function called by Server Actions.
// ============================================================================

/**
 * Full input for recalculating an entire quote.
 */
export interface FullQuoteRecalcInput {
  vat_rate: number;  // x100
  sections: SectionInput[];
}

/**
 * Full recalculation result with section details and quote totals.
 */
export interface FullQuoteRecalcResult {
  sections: SectionCalculation[];
  totals: QuoteTotalCalculation;
}

/**
 * Recalculate an entire quote from scratch.
 * 
 * Flow:
 * 1. Calculate each section independently
 * 2. Aggregate into quote totals
 * 3. Apply VAT at the end
 * 
 * Returns both section-level and quote-level results.
 */
export function recalculateQuote(input: FullQuoteRecalcInput): FullQuoteRecalcResult {
  // Step 1: Calculate each section
  const sections = input.sections.map(calculateSection);

  // Step 2: Calculate quote totals from sections
  const totals = calculateQuoteTotals({
    sections,
    vat_rate: input.vat_rate,
  });

  return { sections, totals };
}
