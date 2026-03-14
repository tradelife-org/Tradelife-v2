'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ============================================================================
// VISIT ACTIONS (Updated with Task Trigger)
// ============================================================================

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
  const supabase = await createServerSupabaseClient()
  
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
      trade_role_label: 'Staff' 
    }))

    await supabase.from('visit_assignments').insert(assignments)
  }

  // 3. TASK TRIGGER (AssistantLife)
  // "When a new job_visit is created, automatically generate a 'Prepare for Site' task"
  
  const taskDueDate = new Date(data.startTime)
  taskDueDate.setHours(taskDueDate.getHours() - 24) // Due 24h before visit

  await supabase.from('assistant_tasks').insert({
    org_id: profile.org_id,
    title: `Prepare for Site: ${data.title}`,
    description: `Auto-generated task for visit on ${new Date(data.startTime).toLocaleDateString()}. Check tools and materials.`,
    status: 'PENDING',
    priority: 'NORMAL',
    due_date: taskDueDate.toISOString(),
    related_job_id: data.jobId,
    // Assign to first user if any, or unassigned
    assigned_to: data.assignedUserIds[0] || null
  })

  revalidatePath('/calendar')
  revalidatePath('/assistant')
  revalidatePath(`/jobs/${data.jobId}`)
  
  return { success: true, visitId: visit.id }
}

export async function updateVisitStatusAction(visitId: string, status: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('job_visits')
    .update({ status })
    .eq('id', visitId)

  if (error) throw new Error(error.message)
  revalidatePath('/calendar')
}

export async function updateJobScheduleAction(jobId: string, scheduledStart: string, scheduledEnd: string) {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) throw new Error('Profile not found')

  // Update DB
  const { data: job, error } = await supabase
    .from('jobs')
    .update({ 
      scheduled_start: scheduledStart, 
      scheduled_end: scheduledEnd,
      status: 'BOOKED' // Auto update status
    })
    .eq('id', jobId)
    .eq('org_id', profile.org_id)
    .select('title, address, google_calendar_event_id')
    .single()

  if (error || !job) throw new Error(error?.message || 'Update failed')

  // Google Calendar Sync
  const gcalToken = process.env.GOOGLE_CALENDAR_ACCESS_TOKEN
  if (gcalToken) {
    try {
      const event = {
        summary: `TradeLife Job: ${job.title}`,
        location: job.address || '',
        start: { dateTime: scheduledStart },
        end: { dateTime: scheduledEnd },
      }

      if (job.google_calendar_event_id) {
        // Update existing
        await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${job.google_calendar_event_id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${gcalToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        })
      } else {
        // Create new
        const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${gcalToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        })
        const data = await res.json()
        if (data.id) {
          await supabase.from('jobs').update({ google_calendar_event_id: data.id }).eq('id', jobId)
        }
      }
    } catch (gcalErr) {
      console.error('Google Calendar sync failed:', gcalErr)
    }
  }

  revalidatePath('/calendar')
  revalidatePath('/jobs')
  revalidatePath(`/jobs/${jobId}`)

  return { success: true }
}
