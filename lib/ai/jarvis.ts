// ============================================================================
// TradeLife v2 — Jarvis AI Orchestrator
// lib/ai/jarvis.ts
//
// The AI brain of TradeLife. Routes intents to the correct Gemini model:
// - Flash: speed tasks (scope drafting, Van Voice, intent routing)
// - Pro: deep reasoning (financial analysis, burn rate, dispute mediation)
//
// All functions inject TRADELIFE_SCHEMA_CONTEXT so Gemini is always
// aware of BIGINT constraints, org_id isolation, and business rules.
// ============================================================================

import { generateFlash, generatePro, generateFlashJSON, generateProJSON } from './gemini'
import { TRADELIFE_SCHEMA_CONTEXT } from './schema-context'

// ---------------------------------------------------------------------------
// INTENT ROUTING (Flash — speed-critical)
// Converts raw user text/voice into a structured intent
// ---------------------------------------------------------------------------

export interface ParsedIntent {
  intent: 'create_quote' | 'update_section' | 'add_material' | 'set_margin' | 'ask_advice' | 'unknown'
  confidence: number
  entities: Record<string, string | number>
  raw_text: string
}

export async function routeIntent(userInput: string): Promise<ParsedIntent> {
  const systemPrompt = `${TRADELIFE_SCHEMA_CONTEXT}

You are Jarvis, the TradeLife AI orchestrator. Parse the user's voice/text input into a structured intent.
Return JSON with: intent, confidence (0-1), entities (extracted values), raw_text.
All monetary values must be in PENCE (integer). "two fifty a day" = 25000 pence.
All percentages must be x100 integer. "twenty percent" = 2000.`

  return generateFlashJSON<ParsedIntent>(
    `Parse this trade input: "${userInput}"`,
    systemPrompt
  )
}

// ---------------------------------------------------------------------------
// SCOPE OF WORKS DRAFTER (Flash — real-time)
// Generates professional scope descriptions from rough trade inputs
// ---------------------------------------------------------------------------

export async function draftScopeOfWorks(
  sectionTitle: string,
  tradeType: string,
  roughNotes: string
): Promise<string> {
  const systemPrompt = `${TRADELIFE_SCHEMA_CONTEXT}

You are Jarvis, drafting a professional Scope of Works for a UK tradesperson's quote.
Write clear, concise, professional descriptions. Use UK English.
Do NOT include pricing — only describe the work to be done.
Keep it under 200 words. Use bullet points for clarity.`

  return generateFlash(
    `Draft a Scope of Works for:
Section: ${sectionTitle}
Trade: ${tradeType}
Rough notes: ${roughNotes}`,
    systemPrompt
  )
}

// ---------------------------------------------------------------------------
// EXECUTIVE SUMMARY GENERATOR (Flash)
// Creates a professional summary for the Hybrid Proposal Builder
// ---------------------------------------------------------------------------

export async function generateExecutiveSummary(quoteData: {
  sections: { title: string; trade_type: string; section_revenue_total: number }[]
  quote_amount_net: number
  quote_amount_gross: number
  vat_rate: number
  client_name?: string
}): Promise<string> {
  const systemPrompt = `${TRADELIFE_SCHEMA_CONTEXT}

You are Jarvis, writing an Executive Summary for a trade quote proposal.
Be professional, concise, and confidence-inspiring. UK English.
Remember: all monetary values in the input are in PENCE. Convert to pounds for display (divide by 100).
Keep to 2-3 paragraphs. Do not invent scope details not provided.`

  return generateFlash(
    `Generate an Executive Summary for this quote:
Client: ${quoteData.client_name || 'Valued Customer'}
Sections: ${JSON.stringify(quoteData.sections)}
Net Total: ${quoteData.quote_amount_net} pence
Gross Total: ${quoteData.quote_amount_gross} pence
VAT Rate: ${quoteData.vat_rate} (x100, so 2000 = 20%)`,
    systemPrompt
  )
}

// ---------------------------------------------------------------------------
// PRICING ADVISOR (Pro — deep reasoning)
// Analyses pricing against Income Floor and Burn Rate logic
// ---------------------------------------------------------------------------

export interface PricingAdvice {
  assessment: 'healthy' | 'warning' | 'critical'
  margin_analysis: string
  suggestions: string[]
  income_floor_note: string
}

export async function analysePricing(quoteData: {
  quote_total_cost: number
  quote_amount_net: number
  quote_profit: number
  quote_margin_percentage: number
  sections: { title: string; margin_percentage: number; section_cost_total: number }[]
}): Promise<PricingAdvice> {
  const systemPrompt = `${TRADELIFE_SCHEMA_CONTEXT}

You are Jarvis, the financial advisor for a UK tradesperson.
Analyse the quote pricing and provide actionable advice.
All values are in PENCE (BIGINT). Percentages are x100 (2500 = 25%).
Consider: typical UK trade margins (15-35%), material cost trends, labour market rates.
Reference the Income Floor concept: minimum revenue needed to cover fixed costs before profit allocation.
Return JSON with: assessment, margin_analysis, suggestions (array), income_floor_note.`

  return generateProJSON<PricingAdvice>(
    `Analyse this quote pricing:
Total Cost: ${quoteData.quote_total_cost} pence
Net Revenue: ${quoteData.quote_amount_net} pence
Profit: ${quoteData.quote_profit} pence
Overall Margin: ${quoteData.quote_margin_percentage} (x100)
Sections: ${JSON.stringify(quoteData.sections)}`,
    systemPrompt
  )
}

// ---------------------------------------------------------------------------
// DISPUTE MEDIATION (Pro — deep reasoning)
// Helps resolve "Can You Just" variation disputes
// ---------------------------------------------------------------------------

export async function mediateDispute(context: {
  original_scope: string
  requested_change: string
  estimated_cost_pence: number
  client_relationship: string
}): Promise<string> {
  const systemPrompt = `${TRADELIFE_SCHEMA_CONTEXT}

You are Jarvis, mediating a "Can You Just" dispute for a UK tradesperson.
The client has requested additional work beyond the original quote scope.
Advise the tradesperson on: whether to charge, how much, and how to communicate it professionally.
Reference the Variations system: PROPOSED → APPROVED → creates new JobLineItem.
Be practical, fair, and protect the tradesperson's margin. UK English.`

  return generatePro(
    `Mediate this variation request:
Original Scope: ${context.original_scope}
Client Request: ${context.requested_change}
Estimated Cost: ${context.estimated_cost_pence} pence
Relationship: ${context.client_relationship}`,
    systemPrompt
  )
}
