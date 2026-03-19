import OpenAI from 'openai'

export interface ClassificationResult {
  type: 'business' | 'personal'
  category: string
  confidence: number
}

export interface Transaction {
  id: string
  org_id?: string
  amount: number
  description: string
  merchant: string
  date: string
  type?: 'business' | 'personal'
  category?: string
  confidence?: number
}

export interface UserRule {
  merchant: string
  type: 'business' | 'personal'
  category: string
}

const HARDCODED_RULES: Record<string, ClassificationResult> = {
  screwfix: { type: 'business', category: 'materials', confidence: 0.95 },
  toolstation: { type: 'business', category: 'materials', confidence: 0.95 },
  cef: { type: 'business', category: 'materials', confidence: 0.95 },
  tesco: { type: 'personal', category: 'groceries', confidence: 0.95 },
  asda: { type: 'personal', category: 'groceries', confidence: 0.95 },
  aldi: { type: 'personal', category: 'groceries', confidence: 0.95 },
}

function matchHardcodedRule(merchant: string): ClassificationResult | null {
  const lower = merchant.toLowerCase().trim()
  for (const [key, result] of Object.entries(HARDCODED_RULES)) {
    if (lower.includes(key)) {
      return result
    }
  }
  return null
}

function matchUserRule(merchant: string, userRules: UserRule[]): ClassificationResult | null {
  const lower = merchant.toLowerCase().trim()
  for (const rule of userRules) {
    if (lower.includes(rule.merchant.toLowerCase())) {
      return { type: rule.type, category: rule.category, confidence: 0.9 }
    }
  }
  return null
}

async function classifyWithAI(merchant: string, description: string, amount: number): Promise<ClassificationResult> {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    })

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You classify bank transactions for UK tradespeople as business or personal.
Return JSON only: {"type":"business"|"personal","category":"string","confidence":number}
confidence should be between 0.5 and 0.95.
Categories: materials, tools, fuel, insurance, subscriptions, groceries, dining, entertainment, utilities, transport, other.`,
        },
        {
          role: 'user',
          content: `Merchant: ${merchant}\nDescription: ${description}\nAmount: £${amount}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 100,
    })

    const text = response.choices[0]?.message?.content?.trim() || ''
    const parsed = JSON.parse(text)
    return {
      type: parsed.type === 'business' ? 'business' : 'personal',
      category: parsed.category || 'other',
      confidence: Math.min(Math.max(parsed.confidence || 0.5, 0.5), 0.95),
    }
  } catch {
    return { type: 'personal', category: 'other', confidence: 0.5 }
  }
}

export async function classifyTransaction(
  transaction: { merchant: string; description: string; amount: number },
  userRules: UserRule[] = []
): Promise<ClassificationResult> {
  const hardcoded = matchHardcodedRule(transaction.merchant)
  if (hardcoded) return hardcoded

  const userRule = matchUserRule(transaction.merchant, userRules)
  if (userRule) return userRule

  return classifyWithAI(transaction.merchant, transaction.description, transaction.amount)
}
