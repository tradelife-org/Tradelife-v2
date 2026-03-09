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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 1. Define Public Routes (Explicit list)
  const publicRoutes = ['/login', '/signup', '/auth/callback', '/api/health']
  const path = request.nextUrl.pathname
  
  // Check if current path starts with any public route
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route))

  // 2. Refresh Session
  const { data: { user } } = await supabase.auth.getUser()

  // 3. Logic
  // If we are on a public route, do NOT redirect. Allow pass-through.
  if (isPublicRoute) {
    // Exception: If user is already logged in and hitting login/signup, we might want to redirect,
    // BUT to prevent hanging loops during auth transitions, we will allow it for now
    // or handle it carefully.
    // To strictly follow "Prevent login promise from hanging", we must NOT block /login or /auth/callback.
    
    // We can optionally redirect logged-in users away from /login, but ONLY if we are sure.
    if (user && (path.startsWith('/login') || path.startsWith('/signup'))) {
       const onboardingCompleted = user.user_metadata?.onboarding_completed === true
       const dest = onboardingCompleted ? '/dashboard' : '/onboarding'
       return NextResponse.redirect(new URL(dest, request.url))
    }
    
    return response
  }

  // 4. Protected Routes
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 5. User Exists & Protected Route -> Allow Navigation / Handle Onboarding
  if (user) {
    const onboardingCompleted = user.user_metadata?.onboarding_completed === true
    const isOnboarding = path.startsWith('/onboarding')

    // Force onboarding if incomplete
    if (!onboardingCompleted && !isOnboarding) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // Lock completed users out of onboarding
    if (onboardingCompleted && isOnboarding) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
