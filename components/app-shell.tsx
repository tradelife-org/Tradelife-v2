import { TopBar } from './layout/TopBar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      <main className="px-4 py-5 sm:px-6 sm:py-6">
        {children}
      </main>
    </div>
  )
}
