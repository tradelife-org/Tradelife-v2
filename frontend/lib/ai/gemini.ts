import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = process.env.GEMINI_API_KEY

export async function generateContent(prompt: string, jsonMode: boolean = false, imageParts: any[] = []): Promise<string> {
  if (!API_KEY) throw new Error('GEMINI_API_KEY missing')

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`
  
  const parts = [{ text: prompt }, ...imageParts]

  const body: any = {
    contents: [{ parts: parts }]
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
    throw new Error(`Gemini API Error: ${err}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}
