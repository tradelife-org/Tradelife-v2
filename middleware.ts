import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {

  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => req.cookies.get(name)?.value } }
  )

  const {
    data: { session }
  } = await supabase.auth.getSession()

  const pathname = req.nextUrl.pathname

  const publicRoutes = [
    '/login',
    '/signup'
  ]

  const path = req.nextUrl.pathname

  const isPublicRoute =
    path === '/' ||
    path === '/login' ||
    path === '/signup' ||
    path === '/forgot-password' ||
    path === '/reset-password' ||
    path.startsWith('/view/') ||
    path.startsWith('/auth/') ||
    path.startsWith('/api/') ||
    path.startsWith('/_next/')

  if (!session?.user) {
    if (!isPublicRoute) {
      const url = req.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  const onboardingCompleted = session?.user.session?.user_metadata?.onboarding_completed === true

  if (onboardingCompleted) {
    if (path === '/onboarding' || path === '/login' || path === '/signup') {
      const url = req.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  } else {
    // Not onboarding complete
    if (path !== '/onboarding' && !path.startsWith('/api/') && !path.startsWith('/auth/') && !path.startsWith('/_next/')) {
        const url = req.nextUrl.clone()
        url.pathname = '/onboarding'
        return NextResponse.redirect(url)
    }
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
