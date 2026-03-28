import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error) {
        const target = next.startsWith('/') ? next : `/${next}`
        return NextResponse.redirect(new URL(target, request.url))
      }
    } catch {
      // env missing or client null — fall through to /login
    }
  }

  return NextResponse.redirect(new URL('/login', request.url))
}
