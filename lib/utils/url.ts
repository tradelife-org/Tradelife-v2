/**
 * Returns the canonical site URL.
 * In production (Vercel): NEXT_PUBLIC_SITE_URL = https://tradelife.app
 * In preview: falls back to NEXT_PUBLIC_VERCEL_URL or localhost.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  }
  return 'http://localhost:3000'
}

/**
 * Build the auth callback URL for email confirmations.
 * Points to: https://tradelife.app/auth/callback
 */
export function getAuthCallbackUrl(): string {
  return `${getSiteUrl()}/auth/callback`
}

/**
 * Build a public quote share link.
 * Example: https://tradelife.app/view/abc123...
 */
export function getQuoteShareUrl(shareToken: string): string {
  return `${getSiteUrl()}/view/${shareToken}`
}
