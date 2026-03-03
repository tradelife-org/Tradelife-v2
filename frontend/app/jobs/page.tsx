import { AppShell } from '@/components/app-shell'
import { Briefcase } from 'lucide-react'

export default function JobsPage() {
  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-heading font-black text-slate-900" data-testid="jobs-title">Jobs</h1>
        </div>
        <div className="text-center py-20">
          <Briefcase className="w-12 h-12 text-slate-200 mx-auto" />
          <h3 className="mt-4 text-lg font-heading font-bold text-slate-400">Coming soon</h3>
          <p className="text-sm text-slate-400 mt-1">Jobs will appear here once you accept a quote</p>
        </div>
      </div>
    </AppShell>
  )
}
