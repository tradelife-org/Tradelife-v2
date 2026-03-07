import { GoogleGenerativeAI } from '@google/generative-ai'

export const GEMINI_FLASH = 'gemini-1.5-flash'
export const GEMINI_PRO = 'gemini-1.5-pro'

const API_KEY = process.env.GEMINI_API_KEY

if (!API_KEY) {
  console.warn('GEMINI_API_KEY is missing')
}

async function callGemini(model: string, prompt: string, jsonMode: boolean = false, imageParts: any[] = []) {
    if (!API_KEY) throw new Error('GEMINI_API_KEY missing')
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`
    
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
      throw new Error(`Gemini API Error (${model}): ${err}`)
    }
  
    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

export async function generateFlash(prompt: string, contextOrJson?: string | boolean, imageParts?: any[]) {
    let finalPrompt = prompt;
    let jsonMode = false;
    let images: any[] = imageParts || [];

    if (typeof contextOrJson === 'boolean') {
        jsonMode = contextOrJson;
    } else if (typeof contextOrJson === 'string') {
        finalPrompt = `${contextOrJson}\n\n${prompt}`;
    }

    return callGemini(GEMINI_FLASH, finalPrompt, jsonMode, images)
}

export async function generatePro(prompt: string, contextOrJson?: string | boolean, imageParts?: any[]) {
    let finalPrompt = prompt;
    let jsonMode = false;
    let images: any[] = imageParts || [];

    if (typeof contextOrJson === 'boolean') {
        jsonMode = contextOrJson;
    } else if (typeof contextOrJson === 'string') {
        finalPrompt = `${contextOrJson}\n\n${prompt}`;
    }

    return callGemini(GEMINI_PRO, finalPrompt, jsonMode, images)
}

export async function generateContent(prompt: string, jsonMode: boolean = false, imageParts: any[] = []) {
    return generateFlash(prompt, jsonMode, imageParts)
}

function cleanAndParseJSON<T>(text: string): T {
    try {
        let cleanText = text.trim();
        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '');
        } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/^```/, '').replace(/```$/, '');
        }
        return JSON.parse(cleanText) as T;
    } catch (e) {
        console.error("Failed to parse JSON:", text);
        throw e;
    }
}

export async function generateFlashJSON<T = any>(prompt: string, contextOrImages?: string | any[]): Promise<T> {
    let finalPrompt = prompt;
    let images: any[] = [];
    
    if (typeof contextOrImages === 'string') {
        finalPrompt = `${contextOrImages}\n\n${prompt}`;
    } else if (Array.isArray(contextOrImages)) {
        images = contextOrImages;
    }

    const text = await generateFlash(finalPrompt, true, images)
    return cleanAndParseJSON<T>(text)
}

export async function generateProJSON<T = any>(prompt: string, contextOrImages?: string | any[]): Promise<T> {
    let finalPrompt = prompt;
    let images: any[] = [];
    
    if (typeof contextOrImages === 'string') {
        finalPrompt = `${contextOrImages}\n\n${prompt}`;
    } else if (Array.isArray(contextOrImages)) {
        images = contextOrImages;
    }

    const text = await generatePro(finalPrompt, true, images)
    return cleanAndParseJSON<T>(text)
}
