import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow webhook endpoints without auth
  if (pathname.startsWith('/api/webhooks')) {
    return NextResponse.next()
  }

  return NextResponse.next()
}
