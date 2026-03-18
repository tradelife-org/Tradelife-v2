import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

import { createAdminSupabaseClient } from './admin'
import { getSupabaseEnv } from './env.server'

function createRequestScopedSupabaseClient() {
  const cookieStore = cookies()
  const { url, anonKey } = getSupabaseEnv()

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {}
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch {}
      },
    },
  })
}

export function createClient() {
  return createRequestScopedSupabaseClient()
}

export async function createServerSupabaseClient() {
  return createRequestScopedSupabaseClient()
}

export function createServiceRoleClient() {
  return createAdminSupabaseClient()
}

export const adminClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = createAdminSupabaseClient() as SupabaseClient
    const value = Reflect.get(client as object, prop, receiver)

    if (typeof value === 'function') {
      return value.bind(client)
    }

    return value
  },
})
