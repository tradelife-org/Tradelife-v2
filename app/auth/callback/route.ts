import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/quotes/create'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: any[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // FIX: Force redirect to the production URL to avoid localhost issues
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tradelife.app'
      // Ensure no double slashes if next starts with /
      const targetPath = next.startsWith('/') ? next.slice(1) : next
      const redirectUrl = `${siteUrl}/${targetPath}`
      
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Error case
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tradelife.app'
  return NextResponse.redirect(`${siteUrl}/login`)
}
