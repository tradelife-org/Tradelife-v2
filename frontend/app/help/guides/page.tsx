import { AppShell } from '@/components/app-shell'
import GuidesDashboard from '@/components/help/guides-dashboard'

export default function GuidesPage() {
  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8">
        <GuidesDashboard />
      </div>
    </AppShell>
  )
}
