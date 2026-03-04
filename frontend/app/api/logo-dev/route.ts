import { NextResponse } from 'next/server'

// LOGO.DEV Proxy - Using provided key logic properly now
// But wait, the onboarding action handles it by calling Logo.dev API directly via fetch in server action?
// Or we fetch URL here and server action downloads it?
// The prompt says "Fetch the official Registered Office Address... Ensure the Logo from Logo.dev is downloaded...".
// My onboarding action logic does:
// 1. Client calls /api/logo-dev to get a URL (Task 1 says "Ensure the Logo... is downloaded and stored").
// 2. Client passes URL to Server Action.
// 3. Server Action fetches URL -> Uploads to Storage.
// So /api/logo-dev needs to return a valid URL.
// Logo.dev provides direct image URLs: https://img.logo.dev/{domain}?token={key}
// So we just return that URL.

const API_KEY = process.env.NEXT_PUBLIC_LOGO_DEV_KEY

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const domain = searchParams.get('domain')
  
  if (!domain) {
    return NextResponse.json({ error: 'Domain required' }, { status: 400 })
  }

  if (!API_KEY) {
    console.error('Logo.dev API key missing')
    return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
  }

  // Construct URL
  const logoUrl = `https://img.logo.dev/${domain}?token=${API_KEY}&size=128&format=png`

  // Verify if logo exists (optional, but good UX)
  // Fetch head?
  try {
    const res = await fetch(logoUrl, { method: 'HEAD' })
    if (res.ok) {
      return NextResponse.json({ url: logoUrl })
    } else {
      return NextResponse.json({ url: null }) // No logo found
    }
  } catch (err) {
    return NextResponse.json({ url: null })
  }
}
