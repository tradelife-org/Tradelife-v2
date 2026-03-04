import { NextResponse } from 'next/server'

// LOGO.DEV Proxy
// Using key from env: NEXT_PUBLIC_LOGO_DEV_KEY
// Note: Logo.dev usually provides a direct URL for frontend use, but if we need backend fetch,
// we can do it here. Or we can just construct the URL on the client?
// The prompt says "fetch the logo via Logo.dev".
// Logo.dev usually works by domain: https://img.logo.dev/{domain}?token={key}
// Let's implement a backend route to securely fetch or return the URL.
// Actually, exposing the key on client (NEXT_PUBLIC_) is fine for logo.dev usually?
// But let's keep it clean.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const domain = searchParams.get('domain')
  
  if (!domain) {
    return NextResponse.json({ error: 'Domain required' }, { status: 400 })
  }

  const apiKey = process.env.NEXT_PUBLIC_LOGO_DEV_KEY
  if (!apiKey) {
    console.error('Logo.dev API key missing')
    return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
  }

  // Logo.dev URL construction
  const logoUrl = `https://img.logo.dev/${domain}?token=${apiKey}&size=128&format=png`

  // Return the URL directly so frontend can use it?
  // Or fetch the image and proxy it? Usually URL is fine.
  return NextResponse.json({ url: logoUrl })
}
