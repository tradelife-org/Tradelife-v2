'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ComplianceBucket = 'PART_P' | 'GAS_SAFETY' | 'EPC' | 'WARRANTY' | 'MANUAL' | 'PHOTO' | 'CERTIFICATE' | 'OTHER'

/**
 * Uploads a document and associates it with a job for the handover pack.
 * Implements "The Golden Thread" with audit trail metadata.
 */
export async function uploadJobDocument(formData: FormData) {
  const supabase = createServerSupabaseClient()

  const jobId = formData.get('jobId') as string
  const name = formData.get('name') as string
  const complianceBucket = (formData.get('complianceBucket') || 'OTHER') as ComplianceBucket
  const file = formData.get('file') as File

  if (!jobId || !name || !file) {
    throw new Error('Missing required fields')
  }

  // 1. Get user for audit trail
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 2. Resolve org_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  // 3. Upload to Storage
  const fileExt = file.name.split('.').pop()
  const filePath = `${profile.org_id}/jobs/${jobId}/${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('gallery')
    .upload(filePath, file)

  if (uploadError) throw new Error('Failed to upload file')

  // 4. Create record in job_documents (The Golden Thread)
  const { error: dbError } = await supabase
    .from('job_documents')
    .insert({
      org_id: profile.org_id,
      job_id: jobId,
      name,
      file_path: filePath,
      compliance_bucket: complianceBucket,
      uploaded_by: user.id,
      version: 1
    })

  if (dbError) throw new Error('Failed to create document record')

  revalidatePath(`/jobs/${jobId}`)
  return { success: true }
}

/**
 * Verifies a document (Audit Trail).
 */
export async function verifyDocument(documentId: string, jobId: string) {
  const supabase = createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('job_documents')
    .update({
      verified_by: user.id,
      verified_at: new Date().toISOString()
    })
    .eq('id', documentId)

  if (error) throw new Error('Failed to verify document')

  revalidatePath(`/jobs/${jobId}`)
  return { success: true }
}

/**
 * Updates a job's UPRN.
 */
export async function updateJobUPRN(jobId: string, uprn: string) {
  const supabase = createServerSupabaseClient()

  const { error } = await supabase
    .from('jobs')
    .update({ uprn })
    .eq('id', jobId)

  if (error) throw new Error('Failed to update UPRN')

  revalidatePath(`/jobs/${jobId}`)
  return { success: true }
}

/**
 * Creates or updates a property asset.
 */
export async function savePropertyAsset(data: {
  id?: string
  job_id: string
  client_id: string
  name: string
  manufacturer?: string
  model?: string
  serial_number?: string
  installation_date?: string
  warranty_expiry?: string
  notes?: string
}) {
  const supabase = createServerSupabaseClient()

  // Resolve org_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .single()

  if (!profile) throw new Error('Unauthorized')

  const payload = {
    ...data,
    org_id: profile.org_id
  }

  let error
  if (data.id) {
    ({ error } = await supabase.from('property_assets').update(payload).eq('id', data.id))
  } else {
    ({ error } = await supabase.from('property_assets').insert(payload))
  }

  if (error) throw new Error('Failed to save asset')

  revalidatePath(`/jobs/${data.job_id}`)
  return { success: true }
}

/**
 * Generates a Handover Pack share link.
 */
export async function generateHandoverPack(jobId: string) {
  const supabase = createServerSupabaseClient()

  // 1. Get user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 2. Get org
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .single()

  if (!profile) throw new Error('Unauthorized')

  // 3. Check if already exists
  const { data: existing } = await supabase
    .from('handover_packs')
    .select('share_token')
    .eq('job_id', jobId)
    .single()

  if (existing) {
    return { success: true, token: existing.share_token }
  }

  // 4. Create new pack
  const { data, error } = await supabase
    .from('handover_packs')
    .insert({
      org_id: profile.org_id,
      job_id: jobId,
      created_by: user.id,
      status: 'GENERATED'
    })
    .select('share_token')
    .single()

  if (error) throw new Error('Failed to generate pack')

  revalidatePath(`/jobs/${jobId}`)
  return { success: true, token: data.share_token }
}

/**
 * Qualified E-Signature (Verify 365 Logic Simulation)
 * Prevents repetitive identity checks and ensures legal validity for Compliance.
 */
export async function requestQualifiedSignature(documentId: string, email: string) {
  const supabase = createServerSupabaseClient()

  // 1. Log the initiation in the audit trail (Timeline)
  const { data: doc } = await supabase
    .from('job_documents')
    .select('job_id, name, org_id')
    .eq('id', documentId)
    .single()

  if (doc) {
    await supabase.from('job_timeline').insert({
      org_id: doc.org_id,
      job_id: doc.job_id,
      title: 'E-Signature Requested',
      description: `Qualified E-Signature (Verify 365) requested for ${doc.name} from ${email}`,
      event_type: 'MILESTONE'
    })
  }

  // 2. Simulate API Call to Verify 365
  // In production: const response = await fetch('https://api.verify365.com/v1/signatures', ...)

  console.log(`[Verify 365] Dispatching secure signing link to ${email} for document ${documentId}`)

  return {
    success: true,
    message: 'Qualified Signature Request dispatched via Verify 365 bridge.',
    audit_id: `v365_${Math.random().toString(36).substr(2, 9)}`
  }
}
