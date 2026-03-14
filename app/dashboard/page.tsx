import SceneLayerV3 from "@/visual-engine/scene/SceneLayerV3"
import MorningBriefModal from '@/components/dashboard/morning-brief'
import BasicWidgets from '@/components/dashboard/basic-widgets'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

export default async function DashboardPage() {
  return (
    <SceneLayerV3 scene="remembrance">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-heading font-bold text-slate-900 mb-6 drop-shadow-md">Dashboard</h1>
          
          <MorningBriefModal /> 
          
          <Suspense fallback={
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-blueprint" />
            </div>
          }>
            <BasicWidgets />
          </Suspense>
        </div>
    </SceneLayerV3>
  )
}
