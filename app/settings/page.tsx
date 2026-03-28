import AppShell from '@/components/app-shell'
import PaymentSettings from '@/components/settings/payment-settings'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <AppShell>
      <section className="mx-auto max-w-4xl space-y-8 px-0 py-2" data-testid="settings-page">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3 text-blue-400">
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-neutral-500" data-testid="settings-page-kicker">Workspace</p>
              <h1 className="text-3xl font-semibold text-white" data-testid="settings-page-title">Settings</h1>
            </div>
          </div>
          <p className="text-sm text-neutral-400" data-testid="settings-page-description">Manage payouts and connected financial tools in one place.</p>
        </div>

        <PaymentSettings />
      </section>
    </AppShell>
  )
}
