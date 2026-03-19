import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const path = req.nextUrl.pathname

  // Always allow these routes
  if (
    path.startsWith('/api/') ||
    path.startsWith('/auth/') ||
    path.startsWith('/_next/') ||
    path.startsWith('/view/') ||
    path === '/login' ||
    path === '/signup' ||
    path === '/forgot-password' ||
    path === '/reset-password' ||
    path === '/'
  ) {
    return res
  }

  try {
    // Check if any Supabase auth cookies exist
    const allCookies = req.cookies.getAll()
    const hasAuthCookies = allCookies.some((c) => c.name.includes('sb-'))

    // No auth cookies = auth system not active yet, allow through
    if (!hasAuthCookies) {
      return res
    }

    // Auth cookies present — validate session
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value
          },
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      // Has cookies but no valid session → redirect to login
      if (path === '/onboarding') {
        return res // Safety: always allow onboarding
      }
      const url = req.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Session valid — check onboarding state
    const onboardingComplete =
      session.user.user_metadata?.onboarding_completed === true

    if (!onboardingComplete && path !== '/onboarding') {
      const url = req.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }

    if (onboardingComplete && path === '/onboarding') {
      const url = req.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  } catch (err) {
    console.error('Middleware error:', err)
    // On error, allow through to prevent blank pages
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
