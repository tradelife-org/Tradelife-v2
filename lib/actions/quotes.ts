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
// MARGIN ENGINE — STEP 1: REQUIRED MARGIN
// Derives the margin a quote MUST hit based on financial state.
// ============================================================================

export interface RequiredMarginInput {
  monthlyBurn: number;       // pence — monthly expenses from ledger
  targetRevenue?: number;    // pence — explicit revenue goal (optional)
  jobsPerMonth: number;      // avg jobs completed per month
}

export function calculateRequiredMargin(input: RequiredMarginInput): number {
  const { monthlyBurn, targetRevenue, jobsPerMonth } = input;

  const jobs = Math.max(jobsPerMonth, 1);
  const requiredRevenue = (targetRevenue && targetRevenue > 0)
    ? targetRevenue
    : monthlyBurn;

  const avgRevenuePerJob = requiredRevenue / jobs;

  // Assume avg cost ≈ revenue minus burn-derived profit need.
  // Simplification: avgCost = monthlyBurn / jobs (the expense each job must cover).
  const avgCostPerJob = monthlyBurn / jobs;

  if (avgRevenuePerJob <= 0) return 0;

  const margin = (avgRevenuePerJob - avgCostPerJob) / avgRevenuePerJob;

  // Clamp to [0, 1] — negative margin means burn exceeds target, return 0.
  return Math.max(0, Math.min(margin, 1));
}

// ============================================================================
// MARGIN ENGINE — STEP 2: OUTCOME EVALUATION
// Grades a quote as OK / WARNING / DANGEROUS against required margin.
// ============================================================================

export type QuoteOutcomeStatus = 'OK' | 'WARNING' | 'DANGEROUS';

export interface QuoteEvaluationInput {
  price: number;            // pence — quote_amount_net
  cost: number;             // pence — quote_total_cost
  requiredMargin: number;   // decimal 0-1
}

export interface QuoteEvaluation {
  profit: number;           // pence
  margin: number;           // decimal 0-1
  requiredMargin: number;   // decimal 0-1
  status: QuoteOutcomeStatus;
}

export function evaluateQuote(input: QuoteEvaluationInput): QuoteEvaluation {
  const { price, cost, requiredMargin } = input;

  const profit = price - cost;
  const margin = price > 0 ? profit / price : 0;

  let status: QuoteOutcomeStatus;

  if (margin >= requiredMargin) {
    status = 'OK';
  } else if (margin >= requiredMargin - 0.05) {
    status = 'WARNING';
  } else {
    status = 'DANGEROUS';
  }

  return { profit, margin, requiredMargin, status };
}

// ============================================================================
// MARGIN ENGINE — STEP 3: PROJECTION
// Projects financial outcome across N jobs at current quote metrics.
// ============================================================================

export interface ProjectionInput {
  price: number;    // pence — quote_amount_net
  cost: number;     // pence — quote_total_cost
  jobs?: number;    // number of projected jobs (default 10)
}

export interface QuoteProjection {
  totalRevenue: number;     // pence
  totalProfit: number;      // pence
  avgProfitPerJob: number;  // pence
}

export function projectQuoteOutcome(input: ProjectionInput): QuoteProjection {
  const jobs = Math.max(input.jobs ?? 10, 1);
  const profitPerJob = input.price - input.cost;

  return {
    totalRevenue: input.price * jobs,
    totalProfit: profitPerJob * jobs,
    avgProfitPerJob: profitPerJob,
  };
}

// ============================================================================
// MARGIN ENGINE — STEP 4: RECOMMENDED PRICE
// Calculates the minimum price to hit required margin.
// ============================================================================

export function getRecommendedPrice(cost: number, requiredMargin: number): number {
  // price = cost / (1 - requiredMargin)
  // Guard: if requiredMargin >= 1, return cost * 2 as sane ceiling.
  if (requiredMargin >= 1) return cost * 2;
  return Math.round(cost / (1 - requiredMargin));
}

// ============================================================================
// MARGIN ENGINE — COMPOSITE OUTPUT
// ============================================================================

export interface QuoteOutcomeLayer {
  outcome: {
    status: QuoteOutcomeStatus;
    requiredMargin: number;    // decimal 0-1
    actualMargin: number;      // decimal 0-1
    profit: number;            // pence
  };
  projection: QuoteProjection;
  recommendation: {
    price: number;             // pence — minimum price to hit required margin
  };
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
  outcomeLayer: QuoteOutcomeLayer;
}

export function recalculateQuote(input: FullQuoteRecalcInput, financialContext: RequiredMarginInput): FullQuoteRecalcResult {
  const sections = input.sections.map(calculateSection);

  const totals = calculateQuoteTotals({
    sections,
    vat_rate: input.vat_rate,
  });

  const requiredMargin = calculateRequiredMargin(financialContext);

  const evaluation = evaluateQuote({
    price: totals.quote_amount_net,
    cost: totals.quote_total_cost,
    requiredMargin,
  });

  const projection = projectQuoteOutcome({
    price: totals.quote_amount_net,
    cost: totals.quote_total_cost,
  });

  const recommendedPrice = getRecommendedPrice(
    totals.quote_total_cost,
    requiredMargin,
  );

  const outcomeLayer: QuoteOutcomeLayer = {
    outcome: {
      status: evaluation.status,
      requiredMargin: evaluation.requiredMargin,
      actualMargin: evaluation.margin,
      profit: evaluation.profit,
    },
    projection,
    recommendation: {
      price: recommendedPrice,
    },
  };

  return { sections, totals, outcomeLayer };
}
