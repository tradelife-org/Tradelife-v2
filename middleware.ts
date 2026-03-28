import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: { headers: req.headers } })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return res
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        res.cookies.set(name, value, options)
      },
      remove(name: string, options: any) {
        res.cookies.set(name, '', options)
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  const publicRoutes = ['/', '/login', '/signup', '/auth/callback']
  const { pathname } = req.nextUrl

  if (!user && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL(`/login?next=${pathname}`, req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
