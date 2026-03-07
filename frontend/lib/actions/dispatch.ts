'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Dispatch & Geocoding: Google Maps & Calendar Integration
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

export async function geocodeJobAddressAction(jobId: string) {
  const supabase = createServerSupabaseClient()
  const { orgId } = await getOrgId(supabase)

  const { data: job, error: fetchError } = await supabase
    .from('jobs')
    .select('address')
    .eq('id', jobId)
    .single()

  if (fetchError || !job?.address) {
    throw new Error('Job address not found')
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    console.warn('GOOGLE_MAPS_API_KEY not found, skipping real geocoding')
    return { success: false, error: 'API Key missing' }
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      job.address
    )}&key=${apiKey}`
  )
  const data = await response.json()

  if (data.status !== 'OK') {
    throw new Error(`Geocoding failed: ${data.status}`)
  }

  const { lat, lng } = data.results[0].geometry.location

  const { error: updateError } = await supabase
    .from('jobs')
    .update({
      latitude: lat,
      longitude: lng
    })
    .eq('id', jobId)
    .eq('org_id', orgId)

  if (updateError) throw new Error(`Failed to update geocoding: ${updateError.message}`)

  revalidatePath(`/jobs/${jobId}`)
  return { success: true, lat, lng }
}

export async function scheduleJobVisitAction(data: {
  jobId: string
  title: string
  startTime: string
  endTime: string
  attendees: string[]
}) {
  const supabase = createServerSupabaseClient()
  const { orgId } = await getOrgId(supabase)

  // Note: Actual Google Calendar integration usually requires OAuth2 flow for the user.
  // This implementation assumes a service-level or pre-authorized integration.
  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY
  let calendarEventId = null

  if (apiKey) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary: data.title,
            start: { dateTime: data.startTime },
            end: { dateTime: data.endTime },
            attendees: data.attendees.map((email) => ({ email })),
          }),
        }
      )
      const gcalData = await response.json()
      calendarEventId = gcalData.id
    } catch (e) {
      console.error('Failed to schedule in Google Calendar:', e)
    }
  }

  const { data: visit, error: visitError } = await supabase
    .from('job_visits')
    .insert({
      org_id: orgId,
      job_id: data.jobId,
      title: data.title,
      start_time: data.startTime,
      end_time: data.endTime,
      visit_type: 'SITE_VISIT',
      status: 'SCHEDULED'
    })
    .select()
    .single()

  if (visitError) throw new Error(`Failed to create visit: ${visitError.message}`)

  // 3. Update Job with reference to GCal (using placeholder column)
  if (calendarEventId) {
    await supabase
      .from('jobs')
      .update({ google_calendar_event_id: calendarEventId })
      .eq('id', data.jobId)
  }

  revalidatePath(`/jobs/${data.jobId}`)
  revalidatePath('/calendar')

  return { success: true, visitId: visit.id, calendarEventId }
}

/**
 * Smart Day Builder v1: Cluster jobs by location and calculate travel matrices
 */
export async function getSmartDayRouteAction(date: string) {
  const supabase = createServerSupabaseClient()
  const { orgId } = await getOrgId(supabase)

  // 1. Fetch all visits for the given day that have geocoding
  const { data: visits, error: fetchError } = await supabase
    .from('job_visits')
    .select(`
      *,
      jobs (
        address,
        latitude,
        longitude
      )
    `)
    .eq('org_id', orgId)
    .gte('start_time', `${date}T00:00:00Z`)
    .lte('start_time', `${date}T23:59:59Z`)

  if (fetchError) throw new Error(`Failed to fetch visits: ${fetchError.message}`)
  if (!visits || visits.length === 0) return { route: [] }

  // 2. Basic Clustering / Sorting Logic (Simple Nearest Neighbor for v1)
  // Sort visits based on distance between each other
  const visitsWithCoords = visits.filter(v => v.jobs?.latitude && v.jobs?.longitude)

  // Implementation of a simple sort or clustering logic
  const sortedRoute = [...visitsWithCoords].sort((a, b) => {
      // In v1, we just return them for now, but we could sort by lat/lng proximity
      return (a.jobs.latitude + a.jobs.longitude) - (b.jobs.latitude + b.jobs.longitude)
  })

  // 3. Calculate Travel Matrix (Mocked for v1)
  const routeWithTravel = sortedRoute.map((visit, index) => {
      const nextVisit = sortedRoute[index + 1]
      let travelTimeMinutes = 0

      if (nextVisit) {
          // Haversine or simple distance formula would go here
          // In real implementation: call Google Distance Matrix API
          travelTimeMinutes = 15 // Mock 15 mins between sites
      }

      return {
          ...visit,
          travelToNextMinutes: travelTimeMinutes
      }
  })

  return { route: routeWithTravel }
}
