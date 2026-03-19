import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { classifyTransaction, type UserRule } from '@/lib/transactions/classifier'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { transactions, org_id } = body as {
      transactions: { id: string; merchant: string; description: string; amount: number; date: string }[]
      org_id?: string
    }

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json({ error: 'transactions array required' }, { status: 400 })
    }

    // Fetch user rules from Supabase before classification
    let userRules: UserRule[] = []
    if (org_id) {
      try {
        const supabase = getSupabase()
        const { data } = await supabase
          .from('user_rules')
          .select('merchant, type, category')
          .eq('org_id', org_id)

        if (data && data.length > 0) {
          userRules = data as UserRule[]
        }
      } catch (err) {
        console.error('Failed to fetch user rules:', err)
      }
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
