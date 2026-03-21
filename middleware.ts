import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const pathname = req.nextUrl.pathname

  const isAuthPage =
    pathname === '/login' || pathname === '/signup'

  const isOnboarding = pathname.startsWith('/onboarding')

  const isDashboard = pathname.startsWith('/dashboard')

  // ❌ Not logged in → force login
  if (!session && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // ✅ Logged in
  if (session) {
    // TODO: replace with real check later
    const hasCompletedOnboarding = false

    if (!hasCompletedOnboarding && !isOnboarding) {
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }

    if (hasCompletedOnboarding && isOnboarding) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return res
}