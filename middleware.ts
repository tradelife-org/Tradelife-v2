import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  // Allow all routes to pass through - no auth required for this flow
  const publicRoutes = [
    '/',
    '/onboarding',
    '/dashboard',
    '/transactions',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
  ]

  const isPublic =
    publicRoutes.some((r) => path === r || path.startsWith(r + '/')) ||
    path.startsWith('/api/') ||
    path.startsWith('/auth/') ||
    path.startsWith('/_next/') ||
    path.startsWith('/view/')

  if (isPublic) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
