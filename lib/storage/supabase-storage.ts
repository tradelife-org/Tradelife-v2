import { getSupabaseServerClient } from '@/lib/supabase/server-safe'

// ============================================================================
// STORAGE HELPERS
// ============================================================================

export async function uploadFile(bucket: string, path: string, file: File) {
  const supabase = getSupabaseServerClient()

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file)

  if (error) throw error

  return data
}

export async function getPublicUrl(bucket: string, path: string) {
  const supabase = getSupabaseServerClient()

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  return data.publicUrl
}
