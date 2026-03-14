import { createServerSupabaseClient } from '@/lib/supabase/server'
import { GlassPanel } from '@/components/ui/glass-panel'
import Link from 'next/link'
import { Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import XeroSyncButton from '@/components/jobs/xero-sync-button' // New

import SceneLayerV3 from "@/visual-engine/scene/SceneLayerV3"

export default async function JobsDashboard() {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()

  // Fetch jobs with client names
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*, clients(name)')
    .eq('org_id', profile?.org_id)
    .order('created_at', { ascending: false })

  // Kanban Columns
  const columns = {
    PLANNED: jobs?.filter(j => ['ENQUIRY', 'BOOKED'].includes(j.status)) || [],
    LIVE: jobs?.filter(j => ['ON_SITE', 'IN_PROGRESS'].includes(j.status)) || [],
    BLOCKED: jobs?.filter(j => ['SNAGGING', 'PAUSED'].includes(j.status)) || [],
    COMPLETE: jobs?.filter(j => ['COMPLETED', 'SIGNED_OFF', 'CANCELLED'].includes(j.status)) || []
  }

  return (
    <SceneLayerV3 scene="remembrance">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-slate-900">Job Board</h1>
          <div className="flex items-center gap-3">
            <XeroSyncButton />
            <Link 
              href="/jobs/create" 
              className="inline-flex items-center gap-2 h-10 px-4 bg-blueprint text-white text-sm font-semibold rounded-lg hover:bg-blueprint-700 transition-colors shadow-sm"
            >
              New Job
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-[calc(100vh-160px)]">
          <KanbanColumn title="Planned" jobs={columns.PLANNED} color="bg-slate-100" />
          <KanbanColumn title="Live" jobs={columns.LIVE} color="bg-blue-50" />
          <KanbanColumn title="Blocked / Snagging" jobs={columns.BLOCKED} color="bg-orange-50" />
          <KanbanColumn title="Complete" jobs={columns.COMPLETE} color="bg-green-50" />
        </div>
      </div>
    </SceneLayerV3>
  )
}

function KanbanColumn({ title, jobs, color }: { title: string, jobs: any[], color: string }) {
  return (
    <div className={`flex flex-col h-full rounded-2xl ${color} p-4`}>
      <h3 className="font-bold text-slate-500 uppercase text-xs tracking-wider mb-4 px-2 flex justify-between">
        {title} 
        <span className="bg-white/50 px-2 py-0.5 rounded text-slate-600">{jobs.length}</span>
      </h3>
      
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {jobs.map(job => (
          <Link key={job.id} href={`/jobs/${job.id}`} className="block">
            <GlassPanel className="p-4 bg-white hover:shadow-md transition-all border-white/50 hover:scale-[1.02] duration-200">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">
                  {job.status.replace('_', ' ')}
                </span>
                {/* Status Pulse */}
                <div className={`w-2 h-2 rounded-full ${
                  ['ON_SITE', 'IN_PROGRESS'].includes(job.status) ? 'bg-green-500 animate-pulse' :
                  ['SNAGGING', 'PAUSED'].includes(job.status) ? 'bg-red-500' :
                  'bg-slate-300'
                }`} />
              </div>
              
              <h4 className="font-bold text-slate-800 leading-tight mb-1">{job.title}</h4>
              <p className="text-xs text-slate-500 mb-3">{job.clients?.name}</p>
              
              {job.target_start_date && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar className="w-3 h-3" />
                  {new Date(job.target_start_date).toLocaleDateString()}
                </div>
              )}
            </GlassPanel>
          </Link>
        ))}
        
        {jobs.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-slate-300/20 rounded-xl">
            <p className="text-xs text-slate-400 font-medium">No jobs</p>
          </div>
        )}
      </div>
    </div>
  )
}
