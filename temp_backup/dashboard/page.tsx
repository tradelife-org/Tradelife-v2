'use client'

import * as React from 'react'
import { CommandCenterShell } from '@/components/command-center-shell'
import { getWidgetsData } from '@/lib/actions/command-center'
import MorningBriefModal from '@/components/dashboard/morning-brief'
import DraggableDashboard from '@/components/dashboard/draggable-dashboard' // New

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
      <MorningBriefModal /> 
      <DraggableDashboard data={safeData} />
    </CommandCenterShell>
  )
}
