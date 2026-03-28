import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const AUTH_ROUTES = ['/login', '/signup']
const PUBLIC_ROUTE_PREFIXES = ['/auth/callback', '/view', '/p', '/forgot-password', '/reset-password']
const PROTECTED_ROUTE_PREFIXES = ['/', '/dashboard', '/quotes', '/jobs', '/invoices', '/clients', '/finance', '/settings']

function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

function isPublicRoute(pathname: string) {
  return AUTH_ROUTES.includes(pathname) || PUBLIC_ROUTE_PREFIXES.some((route) => pathname.startsWith(route))
}

function isProtectedRoute(pathname: string) {
  return PROTECTED_ROUTE_PREFIXES.some((route) => (route === '/' ? pathname === '/' : pathname.startsWith(route)))
}

function sanitizeNext(nextValue: string | null) {
  if (!nextValue || !nextValue.startsWith('/')) {
    return '/quotes'
  }

  return nextValue
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  if (!hasSupabaseEnv()) {
    return response
  }

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

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })

          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  if (!user && isProtectedRoute(pathname) && !isPublicRoute(pathname)) {
    const loginUrl = new URL('/login', request.url)
    const nextPath = `${pathname}${request.nextUrl.search}`
    loginUrl.searchParams.set('next', nextPath)
    return NextResponse.redirect(loginUrl)
  }

  if (user && AUTH_ROUTES.includes(pathname)) {
    const nextTarget = sanitizeNext(request.nextUrl.searchParams.get('next'))
    return NextResponse.redirect(new URL(nextTarget, request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
