import { NextResponse } from 'next/server'
import { syncPlaidTransactions } from '@/lib/actions/plaid-sync'

export async function POST(req: Request) {
  try {
    const event = await req.json()

    if (event.webhook_type === 'TRANSACTIONS') {
      if (event.webhook_code === 'SYNC_UPDATES_AVAILABLE' || event.webhook_code === 'DEFAULT_UPDATE') {
        await syncPlaidTransactions(event.item_id)
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Plaid webhook error:', err)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
