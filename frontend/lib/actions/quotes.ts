'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type Quote = {
  id: string
  title: string
  client_id: string
  org_id: string
  created_at: string
  client?: {
    id: string
    name: string
  }
}

export type QuoteResult = {
  success: boolean
  error?: string
  data?: Quote
}

export type QuotesResult = {
  success: boolean
  error?: string
  data?: Quote[]
}

// Helper to get org_id from current user's profile
async function getOrgId(): Promise<{ orgId: string | null; error?: string }> {
  let supabase
  try {
    supabase = await createClient()
  } catch {
    return { orgId: null, error: 'Failed to initialize service' }
  }

  if (!supabase) {
    return { orgId: null, error: 'Service unavailable' }
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { orgId: null, error: 'Not authenticated' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { orgId: null, error: 'Profile not found' }
  }

  if (!profile.org_id) {
    return { orgId: null, error: 'Organisation not assigned' }
  }

  return { orgId: profile.org_id }
}

export async function createQuoteAction(formData: FormData): Promise<QuoteResult> {
  const title = formData.get('title') as string | null
  const clientId = formData.get('client_id') as string | null

  // Validate required fields
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return { success: false, error: 'Quote title is required' }
  }

  if (!clientId || typeof clientId !== 'string' || clientId.trim() === '') {
    return { success: false, error: 'Client is required' }
  }

  const { orgId, error: orgError } = await getOrgId()
  
  if (orgError || !orgId) {
    return { success: false, error: orgError || 'Organisation not found' }
  }

  let supabase
  try {
    supabase = await createClient()
  } catch {
    return { success: false, error: 'Failed to initialize service' }
  }

  if (!supabase) {
    return { success: false, error: 'Service unavailable' }
  }

  // Verify client belongs to org
  try {
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, org_id')
      .eq('id', clientId)
      .eq('org_id', orgId)
      .single()

    if (clientError || !client) {
      return { success: false, error: 'Invalid client selected' }
    }
  } catch {
    return { success: false, error: 'Failed to validate client' }
  }

  // Insert quote
  try {
    const { data, error: insertError } = await supabase
      .from('quotes')
      .insert({
        title: title.trim(),
        client_id: clientId,
        org_id: orgId
      })
      .select()
      .single()

    if (insertError) {
      return { success: false, error: `Failed to create quote: ${insertError.message}` }
    }

    redirect('/quotes')
  } catch (e) {
    // Check if it's a redirect (Next.js throws for redirects)
    if (e && typeof e === 'object' && 'digest' in e) {
      throw e
    }
    return { success: false, error: 'Failed to create quote' }
  }
}

export async function getQuotesAction(): Promise<QuotesResult> {
  const { orgId, error: orgError } = await getOrgId()
  
  if (orgError || !orgId) {
    return { success: false, error: orgError || 'Organisation not found' }
  }

  let supabase
  try {
    supabase = await createClient()
  } catch {
    return { success: false, error: 'Failed to initialize service' }
  }

  if (!supabase) {
    return { success: false, error: 'Service unavailable' }
  }

  try {
    const { data, error: fetchError } = await supabase
      .from('quotes')
      .select(`
        id,
        title,
        client_id,
        org_id,
        created_at,
        client:clients(id, name)
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      return { success: false, error: `Failed to fetch quotes: ${fetchError.message}` }
    }

    // Transform data to flatten client
    const quotes = (data || []).map((quote: Record<string, unknown>) => ({
      ...quote,
      client: Array.isArray(quote.client) ? quote.client[0] : quote.client
    })) as Quote[]

    return { success: true, data: quotes }
  } catch {
    return { success: false, error: 'Failed to fetch quotes' }
  }
}

export async function getQuoteByIdAction(quoteId: string): Promise<QuoteResult> {
  if (!quoteId || typeof quoteId !== 'string') {
    return { success: false, error: 'Invalid quote ID' }
  }

  const { orgId, error: orgError } = await getOrgId()
  
  if (orgError || !orgId) {
    return { success: false, error: orgError || 'Organisation not found' }
  }

  let supabase
  try {
    supabase = await createClient()
  } catch {
    return { success: false, error: 'Failed to initialize service' }
  }

  if (!supabase) {
    return { success: false, error: 'Service unavailable' }
  }

  try {
    const { data, error: fetchError } = await supabase
      .from('quotes')
      .select(`
        id,
        title,
        client_id,
        org_id,
        created_at,
        client:clients(id, name)
      `)
      .eq('id', quoteId)
      .eq('org_id', orgId)
      .single()

    if (fetchError) {
      return { success: false, error: 'Quote not found' }
    }

    if (!data) {
      return { success: false, error: 'Quote not found' }
    }

    // Flatten client
    const quote = {
      ...data,
      client: Array.isArray(data.client) ? data.client[0] : data.client
    } as Quote

    return { success: true, data: quote }
  } catch {
    return { success: false, error: 'Failed to fetch quote' }
  }
}
