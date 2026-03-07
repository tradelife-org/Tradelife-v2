'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Collaboration & Dispatch: Job Workspace Actions
 */

async function getOrgId(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')
  return { orgId: profile.org_id, userId: user.id }
}

export async function inviteParticipantAction(data: {
  jobId: string
  userId: string
  role: 'STAFF' | 'SUBCONTRACTOR' | 'CLIENT_REP'
}) {
  const supabase = createServerSupabaseClient()
  const { orgId, userId: actorId } = await getOrgId(supabase)

  // 1. Add Participant
  const { error } = await supabase
    .from('job_participants')
    .insert({
      org_id: orgId,
      job_id: data.jobId,
      user_id: data.userId,
      role: data.role,
      status: 'INVITED'
    })

  if (error) throw new Error(`Failed to invite participant: ${error.message}`)

  // 2. Log Timeline Event
  await supabase.from('job_timeline_events').insert({
    org_id: orgId,
    job_id: data.jobId,
    title: 'Participant Invited',
    description: `User ${data.userId} invited as ${data.role}`,
    event_type: 'PARTICIPANT',
    created_by: actorId
  })

  revalidatePath(`/jobs/${data.jobId}`)
  return { success: true }
}

export async function removeParticipantAction(jobId: string, targetUserId: string) {
  const supabase = createServerSupabaseClient()
  const { orgId, userId: actorId } = await getOrgId(supabase)

  const { error } = await supabase
    .from('job_participants')
    .update({ status: 'REMOVED' })
    .eq('job_id', jobId)
    .eq('user_id', targetUserId)
    .eq('org_id', orgId)

  if (error) throw new Error(`Failed to remove participant: ${error.message}`)

  // Log Timeline Event
  await supabase.from('job_timeline_events').insert({
    org_id: orgId,
    job_id: jobId,
    title: 'Participant Removed',
    description: `User ${targetUserId} was removed from the job`,
    event_type: 'PARTICIPANT',
    created_by: actorId
  })

  revalidatePath(`/jobs/${jobId}`)
  return { success: true }
}

export async function uploadJobDocumentAction(data: {
  jobId: string
  name: string
  storagePath: string
  visibility: 'INTERNAL' | 'CLIENT_VISIBLE'
}) {
  const supabase = createServerSupabaseClient()
  const { orgId, userId: actorId } = await getOrgId(supabase)

  const { error } = await supabase
    .from('job_documents')
    .insert({
      org_id: orgId,
      job_id: data.jobId,
      name: data.name,
      storage_path: data.storagePath,
      visibility: data.visibility,
      uploaded_by: actorId
    })

  if (error) throw new Error(`Failed to record document: ${error.message}`)

  // Log Timeline Event
  await supabase.from('job_timeline_events').insert({
    org_id: orgId,
    job_id: data.jobId,
    title: 'Document Uploaded',
    description: `Document "${data.name}" uploaded (${data.visibility})`,
    event_type: 'DOCUMENT',
    created_by: actorId
  })

  revalidatePath(`/jobs/${data.jobId}`)
  return { success: true }
}
