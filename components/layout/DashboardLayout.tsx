interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="w-full">
      <div
        data-testid="dashboard-grid"
        className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12 xl:max-w-[1440px]"
      >
        {children}
      </div>
    </div>
  )
}
