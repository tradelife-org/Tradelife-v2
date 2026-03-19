import { TopBar } from './TopBar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <TopBar />
      <main className="p-6">
        <div
          data-testid="dashboard-grid"
          className="grid grid-cols-12 gap-5 max-w-[1440px] mx-auto"
        >
          {children}
        </div>
      </main>
    </div>
  )
}
