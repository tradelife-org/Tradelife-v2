'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { plaidClient } from '@/lib/plaid'
import { CountryCode, Products } from 'plaid'

// --- Plaid Actions ---

export async function createPlaidLinkToken() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase.from('profiles').select('id, org_id').eq('id', user.id).single()

  const response = await plaidClient.linkTokenCreate({
    user: { client_user_id: user.id },
    client_name: 'TradeLife',
    products: [Products.Transactions],
    country_codes: [CountryCode.Gb], // UK Focus
    language: 'en',
  })

  return { link_token: response.data.link_token }
}

export async function exchangePlaidPublicToken(publicToken: string) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) throw new Error('Profile not found')

  const response = await plaidClient.itemPublicTokenExchange({
    public_token: publicToken,
  })

  const accessToken = response.data.access_token
  const itemId = response.data.item_id

  // Save to DB
  await supabase.from('bank_connections').insert({
    org_id: profile.org_id,
    access_token: accessToken,
    item_id: itemId,
    institution_name: 'Unknown Bank' // Could fetch from metadata
  })

  return { success: true }
}

export async function getBankBalance() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) throw new Error('Profile not found')

  const { data: connection } = await supabase
    .from('bank_connections')
    .select('access_token')
    .eq('org_id', profile.org_id)
    .single()

  if (!connection) return 0 // No connection

  try {
    const response = await plaidClient.accountsBalanceGet({
      access_token: connection.access_token
    })
    
    // Sum available balances (in pence)
    // Plaid returns float amounts (e.g. 100.50).
    const total = response.data.accounts.reduce((sum, acc) => {
      return sum + (acc.balances.available || acc.balances.current || 0)
    }, 0)

    return Math.round(total * 100) // Convert to pence
  } catch (err) {
    console.error('Plaid Balance Error', err)
    return 0
  }
}
