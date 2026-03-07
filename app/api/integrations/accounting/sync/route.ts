import { NextResponse } from 'next/server'
import { syncAccountingAction } from '@/lib/actions/intake'

export async function POST() {
  try {
    const result = await syncAccountingAction()
    return NextResponse.json({ success: true, ...result })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
