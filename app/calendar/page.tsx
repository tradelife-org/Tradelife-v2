const supabase = getSupabaseServerClient()
import { createServerSupabaseClient } from '@/lib/supabase/server'
import JobCalendarClient from '@/components/calendar/job-calendar'
import SceneLayerV3 from "@/visual-engine/scene/SceneLayerV3"
import Script from 'next/script'

export default async function CalendarPage() {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()

  // Fetch Jobs specifically looking at scheduled dates
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, status, scheduled_start, scheduled_end, assigned_staff, address, latitude, longitude, clients(name)')
    .eq('org_id', profile?.org_id)
    .neq('status', 'CANCELLED')
    .order('created_at', { ascending: false })

  const { data: staff } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('org_id', profile?.org_id)

  return (
    <SceneLayerV3 scene="remembrance">
      {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
        <Script 
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`} 
          strategy="beforeInteractive" 
        />
      )}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-heading font-bold text-slate-900 mb-8 drop-shadow-md">Schedule & Dispatch</h1>
        <JobCalendarClient jobs={jobs || []} staff={staff || []} />
      </div>
    </SceneLayerV3>
  )
}
