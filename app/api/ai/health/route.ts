import { NextResponse } from 'next/server'
import { generateFlash, generatePro, GEMINI_FLASH, GEMINI_PRO } from '@/lib/ai/gemini'

export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    models: { flash: GEMINI_FLASH, pro: GEMINI_PRO },
  }

  // Test Flash
  const flashStart = Date.now()
  try {
    const flashResponse = await generateFlash('Respond with exactly one word: OK')
    results.flash = {
      status: 'connected',
      latencyMs: Date.now() - flashStart,
      response: flashResponse.slice(0, 50),
    }
  } catch (err: any) {
    results.flash = {
      status: 'error',
      latencyMs: Date.now() - flashStart,
      error: err.message,
    }
  }

  // Test Pro
  const proStart = Date.now()
  try {
    const proResponse = await generatePro('Respond with exactly one word: OK')
    results.pro = {
      status: 'connected',
      latencyMs: Date.now() - proStart,
      response: proResponse.slice(0, 50),
    }
  } catch (err: any) {
    results.pro = {
      status: 'error',
      latencyMs: Date.now() - proStart,
      error: err.message,
    }
  }

  const allOk =
    (results.flash as any)?.status === 'connected' &&
    (results.pro as any)?.status === 'connected'

  return NextResponse.json(results, { status: allOk ? 200 : 503 })
}
