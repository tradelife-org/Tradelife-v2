'use server'

import { generateContent } from '@/lib/ai/gemini'

export interface ParsedQuote {
  clientName: string
  jobDescription: string
  lineItems: Array<{
    description: string
    quantity: number
    estimatedCost: number // in pence (integers)
  }>
}

export async function parseQuoteRequestAction(rawInput: string): Promise<ParsedQuote> {
  const prompt = `
    You are an operational assistant for a tradesperson.
    Analyze the following request: "${rawInput}"
    
    Extract:
    1. Client Name (if missing, use "Unknown Client")
    2. Job Description (summary)
    3. Estimated Line Items (guess quantity and estimated cost in PENCE based on UK trade standards).
       - Cost must be an INTEGER (pence). E.g. £50 -> 5000.
    
    Return ONLY valid JSON with this schema:
    {
      "clientName": "string",
      "jobDescription": "string",
      "lineItems": [
        { "description": "string", "quantity": number, "estimatedCost": number }
      ]
    }
  `

  try {
    const text = await generateContent(prompt, true) // jsonMode=true
    const data = JSON.parse(text)
    return data as ParsedQuote
  } catch (err) {
    console.error('AI Parse failed:', err)
    throw new Error('Failed to parse request')
  }
}
