import { NextResponse } from 'next/server'
import { getMorningBriefData } from '@/lib/actions/brief'

export async function GET() {
  try {
    const data = await getMorningBriefData()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
