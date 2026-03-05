'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createVisitAction(data: {
  jobId: string
  title: string
  description?: string
  visitType: string
  startTime: string // ISO string
  endTime: string // ISO string
  clientVisible: boolean
  assignedUserIds: string[]
}) {
  const supabase = createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  // 1. Create Visit
  const { data: visit, error: visitError } = await supabase
    .from('job_visits')
    .insert({
      org_id: profile.org_id,
      job_id: data.jobId,
      title: data.title,
      description: data.description,
      visit_type: data.visitType,
      start_time: data.startTime,
      end_time: data.endTime,
      client_visible: data.clientVisible
    })
    .select('id')
    .single()

  if (visitError) throw new Error(`Failed to create visit: ${visitError.message}`)

  // 2. Create Assignments
  if (data.assignedUserIds.length > 0) {
    const assignments = data.assignedUserIds.map(userId => ({
      org_id: profile.org_id,
      visit_id: visit.id,
      user_id: userId,
      trade_role_label: 'Staff' // Default for now
    }))

    const { error: assignError } = await supabase
      .from('visit_assignments')
      .insert(assignments)

    if (assignError) {
      console.error('Failed to assign staff:', assignError)
      // Don't fail the whole request, just log
    }
  }

  revalidatePath('/calendar')
  revalidatePath(`/jobs/${data.jobId}`)
  
  return { success: true, visitId: visit.id }
}

export async function updateVisitStatusAction(visitId: string, status: string) {
  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('job_visits')
    .update({ status })
    .eq('id', visitId)

  if (error) throw new Error(error.message)
  revalidatePath('/calendar')
}
