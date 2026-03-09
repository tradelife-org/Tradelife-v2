import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const publicRoutes = ['/login', '/signup', '/auth/callback', '/api/health']
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname)

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    const onboardingCompleted = user.user_metadata?.onboarding_completed === true
    const isOnboardingPage = request.nextUrl.pathname.startsWith('/onboarding')

    // Prevent logged-in users from accessing auth pages
    if (isPublicRoute && request.nextUrl.pathname !== '/api/health' && request.nextUrl.pathname !== '/auth/callback') {
      const url = request.nextUrl.clone()
      url.pathname = onboardingCompleted ? '/dashboard' : '/onboarding'
      return NextResponse.redirect(url)
    }

    // Force incomplete users to onboarding
    if (!onboardingCompleted && !isOnboardingPage && request.nextUrl.pathname !== '/api/health') {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }

    // Prevent complete users from accessing onboarding
    if (onboardingCompleted && isOnboardingPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
