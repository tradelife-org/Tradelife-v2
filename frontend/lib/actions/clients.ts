'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type Client = {
  id: string
  name: string
  email: string | null
  phone: string | null
  org_id: string
  created_at: string
}

export type ClientResult = {
  success: boolean
  error?: string
  data?: Client
}

export type ClientsResult = {
  success: boolean
  error?: string
  data?: Client[]
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

export async function createClientAction(formData: FormData): Promise<ClientResult> {
  const name = formData.get('name') as string | null
  const email = formData.get('email') as string | null
  const phone = formData.get('phone') as string | null

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return { success: false, error: 'Client name is required' }
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
    const { data, error: insertError } = await supabase
      .from('clients')
      .insert({
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        org_id: orgId
      })
      .select()
      .single()

    if (insertError) {
      return { success: false, error: `Failed to create client: ${insertError.message}` }
    }

    redirect('/clients')
  } catch (e) {
    // Check if it's a redirect (Next.js throws for redirects)
    if (e && typeof e === 'object' && 'digest' in e) {
      throw e
    }
    return { success: false, error: 'Failed to create client' }
  }
}

export async function getClientsAction(): Promise<ClientsResult> {
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
      .from('clients')
      .select('id, name, email, phone, org_id, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      return { success: false, error: `Failed to fetch clients: ${fetchError.message}` }
    }

    return { success: true, data: data || [] }
  } catch {
    return { success: false, error: 'Failed to fetch clients' }
  }
}

export async function getClientByIdAction(clientId: string): Promise<ClientResult> {
  if (!clientId || typeof clientId !== 'string') {
    return { success: false, error: 'Invalid client ID' }
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
      .from('clients')
      .select('id, name, email, phone, org_id, created_at')
      .eq('id', clientId)
      .eq('org_id', orgId) // Enforce org ownership
      .single()

    if (fetchError) {
      return { success: false, error: 'Client not found' }
    }

    if (!data) {
      return { success: false, error: 'Client not found' }
    }

    return { success: true, data }
  } catch {
    return { success: false, error: 'Failed to fetch client' }
  }
}
