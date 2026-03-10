import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const user = session?.user ?? null

  const path = request.nextUrl.pathname

  // Public routes logic
  // We allow static assets and API routes to pass through generally, 
  // but for authenticated users with incomplete onboarding, we might restrict even some APIs if not careful.
  // However, assumes /api/ is needed.
  const isPublicRoute =
    path === '/' ||
    path === '/login' ||
    path === '/signup' ||
    path.startsWith('/view/') ||
    path.startsWith('/auth/') ||
    path.startsWith('/api/') ||
    path.startsWith('/_next/') // Should be covered by config matcher but safety net

  // 1. Not Authenticated
  if (!user) {
    // If trying to access a protected route, redirect to login
    if (!isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    // Allow public routes
    return supabaseResponse
  }

  // 2. Authenticated
  const onboardingCompleted = user.user_metadata?.onboarding_completed === true

  if (onboardingCompleted) {
    // If onboarding is complete, prevent access to /onboarding, /login, /signup
    // They should be at dashboard or other app routes
    if (path === '/onboarding' || path === '/login' || path === '/signup') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
    // Allow access to dashboard and other routes
  } else {
    // If onboarding is INCOMPLETE
    // Allow access ONLY to /onboarding and essential API/Auth routes
    
    // If we are NOT at /onboarding AND NOT at an allowed system route (api, auth)
    // Then redirect to /onboarding
    if (path !== '/onboarding' && !path.startsWith('/api/') && !path.startsWith('/auth/') && !path.startsWith('/_next/')) {
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        return NextResponse.redirect(url)
    }
    
    // If we are at /onboarding, allow it. 
    // If we are at /api/..., allow it.
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
