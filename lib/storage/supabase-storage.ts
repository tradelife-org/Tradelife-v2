// ============================================================================
// TradeLife v2 — Supabase Storage Utilities
import { supabase } from "@/lib/supabase/client"
//
// Wraps Supabase Storage for two use cases:
// 1. Price Builder: supplier invoice uploads (OCR processing)
// 2. Gallery Module: before/after job photos
//
// Uses the existing Supabase client (no additional deps needed).
// Buckets must be created in the Supabase Dashboard:
//   - "invoices" (private) — supplier invoice PDFs/images
//   - "gallery"  (public)  — before/after job photos
// ============================================================================

import { supabase } from '@/lib/supabase/client'

// ---------------------------------------------------------------------------
// Bucket Constants
// ---------------------------------------------------------------------------
export const BUCKET_INVOICES = 'invoices'
export const BUCKET_GALLERY = 'gallery'

// ---------------------------------------------------------------------------
// Upload File
// Returns the storage path on success, or null + error message
// ---------------------------------------------------------------------------
export async function uploadFile(
  bucket: string,
  orgId: string,
  file: File,
  subfolder?: string
): Promise<{ path: string; error: null } | { path: null; error: string }> {
  // supabase used

  const ext = file.name.split('.').pop() || 'bin'
  const uniqueName = `${crypto.randomUUID()}.${ext}`
  const storagePath = subfolder
    ? `${orgId}/${subfolder}/${uniqueName}`
    : `${orgId}/${uniqueName}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

  if (error) return { path: null, error: error.message }
  return { path: data.path, error: null }
}

// ---------------------------------------------------------------------------
// Get Public URL (for gallery bucket — public)
// ---------------------------------------------------------------------------
export function getPublicUrl(bucket: string, path: string): string {
  // supabase used
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

// ---------------------------------------------------------------------------
// Get Signed URL (for invoices bucket — private, time-limited)
// ---------------------------------------------------------------------------
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresInSeconds: number = 3600
): Promise<string | null> {
  // supabase used
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds)

  if (error) return null
  return data.signedUrl
}

// ---------------------------------------------------------------------------
// List Files in a folder
// ---------------------------------------------------------------------------
export async function listFiles(
  bucket: string,
  orgId: string,
  subfolder?: string
): Promise<{ name: string; id: string; created_at: string }[]> {
  // supabase used
  const folderPath = subfolder ? `${orgId}/${subfolder}` : orgId

  const { data, error } = await supabase.storage.from(bucket).list(folderPath, {
    limit: 100,
    sortBy: { column: 'created_at', order: 'desc' },
  })

  if (error || !data) return []
  return data.map((f) => ({
    name: f.name,
    id: f.id ?? f.name,
    created_at: f.created_at ?? '',
  }))
}

// ---------------------------------------------------------------------------
// Delete File (soft-delete: moves to trash, recoverable for 30 days)
// ---------------------------------------------------------------------------
export async function deleteFile(
  bucket: string,
  path: string
): Promise<{ success: boolean; error?: string }> {
  // supabase used
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ---------------------------------------------------------------------------
// Upload Invoice (Price Builder shortcut)
// ---------------------------------------------------------------------------
export async function uploadInvoice(orgId: string, file: File) {
  return uploadFile(BUCKET_INVOICES, orgId, file, 'supplier-invoices')
}

// ---------------------------------------------------------------------------
// Upload Gallery Photo (Gallery Module shortcut)
// ---------------------------------------------------------------------------
export async function uploadGalleryPhoto(
  orgId: string,
  jobId: string,
  file: File,
  tag: 'before' | 'after'
) {
  return uploadFile(BUCKET_GALLERY, orgId, file, `jobs/${jobId}/${tag}`)
}
