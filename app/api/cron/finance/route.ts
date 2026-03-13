import { NextResponse } from 'next/server'
import { generateBurnRateSnapshotForAllOrgs } from '@/lib/workers/finance-snapshot'

export async function GET() {
  try {
    await generateBurnRateSnapshotForAllOrgs()
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
