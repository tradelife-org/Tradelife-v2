import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const orgId = searchParams.get('org_id')

    if (!orgId) {
      return NextResponse.json({ transactions: [] })
    }

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('org_id', orgId)
      .order('date', { ascending: false })

    if (error) {
      console.error('Fetch transactions error:', error)
      return NextResponse.json({ transactions: [] })
    }

    return NextResponse.json({ transactions: data || [] })
  } catch (err) {
    console.error('Transactions GET error:', err)
    return NextResponse.json({ transactions: [] })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { transactions, org_id } = body

    if (!transactions || !Array.isArray(transactions) || !org_id) {
      return NextResponse.json({ error: 'transactions array and org_id required' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Check which transactions already exist by looking for matching merchant+date+amount
    const rows = transactions.map((tx: any) => ({
      id: tx.id && tx.id.match(/^[0-9a-f]{8}-/) ? tx.id : randomUUID(),
      org_id,
      amount: tx.amount,
      description: tx.description,
      merchant: tx.merchant,
      date: tx.date,
      type: tx.type || null,
      category: tx.category || null,
      confidence: tx.confidence || null,
    }))

    const { data, error } = await supabase
      .from('transactions')
      .upsert(rows, { onConflict: 'id' })
      .select()

    if (error) {
      console.error('Upsert transactions error:', error)
      return NextResponse.json({ error: 'Failed to save transactions' }, { status: 500 })
    }

    return NextResponse.json({ transactions: data })
  } catch (err) {
    console.error('Transactions POST error:', err)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, type, category, confidence } = body

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('transactions')
      .update({ type, category, confidence })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update transaction error:', error)
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json({ transaction: data })
  } catch (err) {
    console.error('Transaction PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
