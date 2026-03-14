import { AppShell } from '@/components/app-shell'
import PaymentSettings from '@/components/settings/payment-settings'
import { Settings } from 'lucide-react'
import SceneLayerV3 from "@/visual-engine/scene/SceneLayerV3"

export default function SettingsPage() {
  return (
    <SceneLayerV3 scene="remembrance">
      <AppShell>
        <div className="max-w-4xl mx-auto py-8 space-y-8 px-4">
          <div className="flex items-center gap-3 mb-8">
            <Settings className="w-8 h-8 text-slate-400" />
            <h1 className="text-3xl font-heading font-bold text-slate-900">Settings</h1>
          </div>
          
          <PaymentSettings />
        </div>
      </AppShell>
    </SceneLayerV3>
  )
}
