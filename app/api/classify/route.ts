import { NextResponse } from 'next/server'
import { classifyTransaction, type UserRule } from '@/lib/transactions/classifier'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { transactions, userRules = [] } = body as {
      transactions: { id: string; merchant: string; description: string; amount: number; date: string }[]
      userRules?: UserRule[]
    }

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json({ error: 'transactions array required' }, { status: 400 })
    }

    const results = await Promise.all(
      transactions.map(async (tx) => {
        const classification = await classifyTransaction(tx, userRules)
        return {
          ...tx,
          type: classification.type,
          category: classification.category,
          confidence: classification.confidence,
        }
      })
    )

    return NextResponse.json({ transactions: results })
  } catch (err) {
    console.error('Classification error:', err)
    return NextResponse.json({ error: 'Classification failed' }, { status: 500 })
  }
}
