import SceneLayerV3 from "@/visual-engine/scene/SceneLayerV3"
import { CommandCenterShell } from '@/components/command-center-shell'
import { getWidgetsData } from '@/lib/actions/command-center'
import MorningBriefModal from '@/components/dashboard/morning-brief'
import DraggableDashboard from '@/components/dashboard/draggable-dashboard'

export default async function DashboardPage() {
  let data = null
  try {
    data = await getWidgetsData()
  } catch (err) {
    console.error(err)
    data = {
      attention_needed: [],
      active_projects: [],
      live_projects: [],
      tte_schedule: [],
      urgent_tasks: [],
      financial_overview: { revenue: 0, expenses: 0, retention: 0 },
      service_status: []
    }
  }

  return (
    <SceneLayerV3 scene="remembrance">
      <CommandCenterShell>
        <MorningBriefModal /> 
        <DraggableDashboard data={data} />
      </CommandCenterShell>
    </SceneLayerV3>
  )
}
