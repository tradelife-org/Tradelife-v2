import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )

          response = NextResponse.next({ request })

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Secure validation
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isLogin = pathname.startsWith('/login')
  const isSignup = pathname.startsWith('/signup')
  const isAuthCallback = pathname.startsWith('/auth/callback')
  const isOnboarding = pathname.startsWith('/onboarding')
  const isHealth = pathname.startsWith('/api/health')

  const isPublic =
    isLogin ||
    isSignup ||
    isAuthCallback ||
    isHealth

  // Not logged in → redirect to login
  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {

    const onboardingCompleted =
      user.user_metadata?.onboarding_completed === true

    // Prevent logged in users from seeing auth pages
    if ((isLogin || isSignup) && !isHealth) {
      const url = request.nextUrl.clone()
      url.pathname = onboardingCompleted ? '/dashboard' : '/onboarding'
      return NextResponse.redirect(url)
    }

    // Force onboarding if incomplete
    if (!onboardingCompleted && !isOnboarding && !isHealth) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }

    // Prevent completed users from reopening onboarding
    if (onboardingCompleted && isOnboarding) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
