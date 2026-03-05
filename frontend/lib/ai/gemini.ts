import { GoogleGenerativeAI } from '@google/generative-ai'

export const GEMINI_FLASH = 'gemini-1.5-flash'
export const GEMINI_PRO = 'gemini-1.5-pro'

const API_KEY = process.env.GEMINI_API_KEY

if (!API_KEY) {
  console.warn('GEMINI_API_KEY is missing')
}

async function callGemini(model: string, prompt: string, jsonMode: boolean = false) {
    if (!API_KEY) throw new Error('GEMINI_API_KEY missing')
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`
    
    const body: any = {
      contents: [{ parts: [{ text: prompt }] }]
    }
  
    if (jsonMode) {
        body.generationConfig = { response_mime_type: "application/json" }
    }
  
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  
    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Gemini API Error (${model}): ${err}`)
    }
  
    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

export async function generateFlash(prompt: string, jsonMode: boolean = false) {
    return callGemini(GEMINI_FLASH, prompt, jsonMode)
}

export async function generatePro(prompt: string, jsonMode: boolean = false) {
    return callGemini(GEMINI_PRO, prompt, jsonMode)
}

export async function generateContent(prompt: string, jsonMode: boolean = false) {
    return generateFlash(prompt, jsonMode)
}
