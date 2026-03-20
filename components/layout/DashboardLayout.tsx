import { TopBar } from './TopBar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="px-4 py-5 sm:px-6 sm:py-6">
        <div
          data-testid="dashboard-grid"
          className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 max-w-[1440px] mx-auto"
        >
          {children}
        </div>
      </main>
    </div>
  )
}
