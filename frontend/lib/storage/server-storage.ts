// ============================================================================
// TradeLife v2 — Supabase Storage Server Utilities
// lib/storage/server-storage.ts
//
// Server-side storage operations using service role client.
// Bypasses RLS for admin operations (bucket creation, etc.)
// ============================================================================

import { createServiceRoleClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Server-side upload (for API routes / Server Actions)
// ---------------------------------------------------------------------------
export async function serverUploadFile(
  bucket: string,
  path: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<{ path: string; error: null } | { path: null; error: string }> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, fileBuffer, {
      cacheControl: '3600',
      upsert: false,
      contentType,
    })

  if (error) return { path: null, error: error.message }
  return { path: data.path, error: null }
}

// ---------------------------------------------------------------------------
// Server-side signed URL generation
// ---------------------------------------------------------------------------
export async function serverGetSignedUrl(
  bucket: string,
  path: string,
  expiresInSeconds: number = 3600
): Promise<string | null> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds)

  if (error) return null
  return data.signedUrl
}
