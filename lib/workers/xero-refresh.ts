import { xeroClient } from '@/lib/xero'
import { createClient } from '@supabase/supabase-js'

export async function refreshXeroTokens() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
  )

  // Find tokens expiring within the next hour or already expired
  const expiryThreshold = new Date(Date.now() + 3600 * 1000).toISOString()

  const { data: connections, error } = await supabase
    .from('accounting_connections')
    .select('*')
    .lte('expires_at', expiryThreshold)

  if (error) {
    console.error('Failed to fetch expiring Xero connections:', error)
    return { success: false, error: error.message }
  }

  let refreshedCount = 0

  for (const conn of connections) {
    try {
      if (!conn.refresh_token) continue

      xeroClient.setTokenSet({
        access_token: conn.access_token,
        refresh_token: conn.refresh_token,
        token_type: 'Bearer'
      })

      const newTokenSet = await xeroClient.refreshToken()

      await supabase
        .from('accounting_connections')
        .update({
          access_token: newTokenSet.access_token,
          refresh_token: newTokenSet.refresh_token,
          expires_at: new Date(Date.now() + (newTokenSet.expires_in || 3600) * 1000).toISOString()
        })
        .eq('id', conn.id)

      refreshedCount++
    } catch (refreshErr) {
      console.error(`Failed to refresh token for connection ${conn.id}:`, refreshErr)
    }
  }

  return { success: true, refreshedCount }
}
