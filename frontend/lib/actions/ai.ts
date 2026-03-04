'use server'

// ============================================================================
// TradeLife v2 — AI Server Actions
// lib/actions/ai.ts
//
// Server Actions that expose Jarvis AI capabilities to the frontend.
// All Gemini calls happen server-side (API key never exposed to browser).
// ============================================================================

import {
  routeIntent,
  draftScopeOfWorks,
  generateExecutiveSummary,
  analysePricing,
  mediateDispute,
  type ParsedIntent,
  type PricingAdvice,
} from '@/lib/ai/jarvis'

// ---------------------------------------------------------------------------
// Intent Routing (Flash)
// ---------------------------------------------------------------------------
export async function aiRouteIntent(
  userInput: string
): Promise<{ success: boolean; data?: ParsedIntent; error?: string }> {
  try {
    const result = await routeIntent(userInput)
    return { success: true, data: result }
  } catch (err: any) {
    return { success: false, error: err.message || 'Intent routing failed' }
  }
}

// ---------------------------------------------------------------------------
// Scope of Works Drafter (Flash)
// ---------------------------------------------------------------------------
export async function aiDraftScope(
  sectionTitle: string,
  tradeType: string,
  roughNotes: string
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const result = await draftScopeOfWorks(sectionTitle, tradeType, roughNotes)
    return { success: true, data: result }
  } catch (err: any) {
    return { success: false, error: err.message || 'Scope drafting failed' }
  }
}

// ---------------------------------------------------------------------------
// Executive Summary Generator (Flash)
// ---------------------------------------------------------------------------
export async function aiGenerateSummary(
  quoteData: Parameters<typeof generateExecutiveSummary>[0]
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const result = await generateExecutiveSummary(quoteData)
    return { success: true, data: result }
  } catch (err: any) {
    return { success: false, error: err.message || 'Summary generation failed' }
  }
}

// ---------------------------------------------------------------------------
// Pricing Advisor (Pro)
// ---------------------------------------------------------------------------
export async function aiAnalysePricing(
  quoteData: Parameters<typeof analysePricing>[0]
): Promise<{ success: boolean; data?: PricingAdvice; error?: string }> {
  try {
    const result = await analysePricing(quoteData)
    return { success: true, data: result }
  } catch (err: any) {
    return { success: false, error: err.message || 'Pricing analysis failed' }
  }
}

// ---------------------------------------------------------------------------
// Dispute Mediation (Pro)
// ---------------------------------------------------------------------------
export async function aiMediateDispute(
  context: Parameters<typeof mediateDispute>[0]
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const result = await mediateDispute(context)
    return { success: true, data: result }
  } catch (err: any) {
    return { success: false, error: err.message || 'Dispute mediation failed' }
  }
}

// ---------------------------------------------------------------------------
// Health Check — verifies both models are reachable
// ---------------------------------------------------------------------------
export async function aiHealthCheck(): Promise<{
  flash: { ok: boolean; latencyMs: number; error?: string }
  pro: { ok: boolean; latencyMs: number; error?: string }
}> {
  const checkModel = async (
    fn: (prompt: string) => Promise<string>,
    label: string
  ) => {
    const start = Date.now()
    try {
      const result = await fn('Respond with exactly: OK')
      return {
        ok: result.toLowerCase().includes('ok'),
        latencyMs: Date.now() - start,
      }
    } catch (err: any) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        error: err.message,
      }
    }
  }

  const { generateFlash, generatePro } = await import('@/lib/ai/gemini')

  const [flash, pro] = await Promise.all([
    checkModel(generateFlash, 'Flash'),
    checkModel(generatePro, 'Pro'),
  ])

  return { flash, pro }
}
