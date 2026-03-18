import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { getSupabaseEnv } from './env.server'

let adminSupabaseClient: SupabaseClient | null = null

export function createAdminSupabaseClient() {
  if (adminSupabaseClient) {
    return adminSupabaseClient
  }

  const { url, serviceRoleKey } = getSupabaseEnv()

  adminSupabaseClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return adminSupabaseClient
}