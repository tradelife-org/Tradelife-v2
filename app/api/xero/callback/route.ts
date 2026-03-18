export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { handleXeroCallback } from "@/lib/actions/accounting"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get("code")

    if (!code) {
      return NextResponse.redirect(new URL("/settings?error=xero_auth", req.url))
    }

    await handleXeroCallback(req.url)

    return NextResponse.redirect(new URL("/settings?xero=connected", req.url))
  } catch (err) {
    console.error("Xero OAuth error", err)
    return NextResponse.redirect(new URL("/settings?error=xero_failed", req.url))
  }
}
