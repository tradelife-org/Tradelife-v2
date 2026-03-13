import { NextResponse } from 'next/server'
import { refreshXeroTokens } from '@/lib/workers/xero-refresh'

export async function GET() {
  try {
    const result = await refreshXeroTokens()
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
