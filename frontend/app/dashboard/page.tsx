'use client'

import * as React from 'react'
import { CommandCenterShell } from '@/components/command-center-shell'
import { JarvisHub } from '@/components/dashboard/JarvisHub'
import { 
  AttentionNeeded, 
  ActiveProjects, 
  LiveProjects, 
  TTESchedule, 
  UrgentTasks, 
  FinancialOverview,
  ServiceTrafficLights
} from '@/components/dashboard/Widgets'
import { getWidgetsData } from '@/lib/actions/command-center'

export default function DashboardPage() {
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchData() {
      try {
        const json = await getWidgetsData()
        setData(json)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <CommandCenterShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-slate-400 font-mono">Initializing Command Center...</div>
        </div>
      </CommandCenterShell>
    )
  }

  // Fallback if data fetch failed
  const safeData = data || {
    attention_needed: [],
    active_projects: [],
    live_projects: [],
    tte_schedule: [],
    urgent_tasks: [],
    financial_overview: { revenue: 0, expenses: 0, retention: 0 },
    service_status: []
  }

  return (
    <CommandCenterShell>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 h-[calc(100vh-8rem)]">
        
        {/* LEFT COLUMN (1 col wide on LG) */}
        <div className="space-y-6 lg:col-span-1 xl:col-span-1 flex flex-col">
          <div className="flex-1 min-h-[200px]">
            <AttentionNeeded items={safeData.attention_needed} />
          </div>
          <div className="flex-1 min-h-[200px]">
            <ActiveProjects items={safeData.active_projects} />
          </div>
        </div>

        {/* CENTER COLUMN (2 cols wide on LG) */}
        <div className="lg:col-span-2 xl:col-span-2 flex flex-col gap-6">
          <div className="flex-1 min-h-[300px]">
             {/* JARVIS HUB */}
            <JarvisHub />
          </div>
          <div className="h-64">
            <LiveProjects items={safeData.live_projects} />
          </div>
        </div>

        {/* RIGHT COLUMN (1-2 cols wide) */}
        <div className="lg:col-span-1 xl:col-span-2 grid grid-cols-1 xl:grid-cols-2 gap-6">
           <div className="xl:col-span-2 h-64">
             <FinancialOverview data={safeData.financial_overview} />
           </div>
           <div className="flex-1 min-h-[200px]">
             <TTESchedule items={safeData.tte_schedule} />
           </div>
           <div className="flex-1 min-h-[200px]">
             <ServiceTrafficLights items={safeData.service_status || []} />
           </div>
        </div>

      </div>
    </CommandCenterShell>
  )
}
