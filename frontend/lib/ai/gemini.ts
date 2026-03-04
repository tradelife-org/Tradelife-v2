// ============================================================================
// TradeLife v2 — Gemini Client Factory
// lib/ai/gemini.ts
//
// Initialises Google Gemini via the @google/genai SDK.
// Two clients: Flash (speed) and Pro (reasoning).
// Auth: x-goog-api-key via GEMINI_API_KEY env var.
// ============================================================================

import { GoogleGenAI } from '@google/genai'

// Singleton — initialised once, reused across all server action calls
let _genai: GoogleGenAI | null = null

function getGenAI(): GoogleGenAI {
  if (_genai) return _genai
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in environment variables')
  _genai = new GoogleGenAI({ apiKey })
  return _genai
}

// ---------------------------------------------------------------------------
// Model Constants
// ---------------------------------------------------------------------------
export const GEMINI_FLASH = 'gemini-3-flash'
export const GEMINI_PRO = 'gemini-3-pro'

// ---------------------------------------------------------------------------
// Generate Content — Flash (speed-critical tasks)
// Use for: real-time scope drafting, Van Voice processing, intent routing
// ---------------------------------------------------------------------------
export async function generateFlash(
  prompt: string,
  systemInstruction?: string
): Promise<string> {
  const genai = getGenAI()
  const response = await genai.models.generateContent({
    model: GEMINI_FLASH,
    contents: prompt,
    config: systemInstruction ? { systemInstruction } : undefined,
  })
  return response.text ?? ''
}

// ---------------------------------------------------------------------------
// Generate Content — Pro (deep reasoning tasks)
// Use for: financial analysis, burn rate, dispute mediation, advisory
// ---------------------------------------------------------------------------
export async function generatePro(
  prompt: string,
  systemInstruction?: string
): Promise<string> {
  const genai = getGenAI()
  const response = await genai.models.generateContent({
    model: GEMINI_PRO,
    contents: prompt,
    config: systemInstruction ? { systemInstruction } : undefined,
  })
  return response.text ?? ''
}

// ---------------------------------------------------------------------------
// Structured Output — Flash (returns JSON)
// Use for: intent routing, voice-to-structured-data
// ---------------------------------------------------------------------------
export async function generateFlashJSON<T = unknown>(
  prompt: string,
  systemInstruction?: string
): Promise<T> {
  const genai = getGenAI()
  const response = await genai.models.generateContent({
    model: GEMINI_FLASH,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      ...(systemInstruction ? { systemInstruction } : {}),
    },
  })
  const text = response.text ?? '{}'
  return JSON.parse(text) as T
}

// ---------------------------------------------------------------------------
// Structured Output — Pro (returns JSON)
// Use for: financial analysis results, pricing suggestions
// ---------------------------------------------------------------------------
export async function generateProJSON<T = unknown>(
  prompt: string,
  systemInstruction?: string
): Promise<T> {
  const genai = getGenAI()
  const response = await genai.models.generateContent({
    model: GEMINI_PRO,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      ...(systemInstruction ? { systemInstruction } : {}),
    },
  })
  const text = response.text ?? '{}'
  return JSON.parse(text) as T
}
