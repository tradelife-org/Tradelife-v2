import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'TradeLife',
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  )
}
