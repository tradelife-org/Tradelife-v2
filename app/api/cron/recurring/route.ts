import { NextResponse } from 'next/server'
import { processRecurringServicesAction } from '@/lib/actions/automation'

export async function GET() {
  try {
    const result = await processRecurringServicesAction()
    return NextResponse.json({ success: true, ...result })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
