'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  FileText, Briefcase, Settings, LogOut,
  PlusCircle, Menu, X, ChevronRight,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/quotes', label: 'Quotes', icon: FileText },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [userEmail, setUserEmail] = React.useState<string | null>(null)

  React.useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserEmail(user.email ?? null)
    })
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Left: Logo + Mobile Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-1.5 -ml-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              data-testid="mobile-menu-toggle"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/quotes" className="flex items-center gap-1" data-testid="nav-logo">
              <span className="font-heading font-black text-xl text-slate-900 tracking-tight">
                TradeLife<span className="text-blueprint">.</span>
              </span>
            </Link>
          </div>

          {/* Center: Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1" data-testid="desktop-nav">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blueprint-50 text-blueprint font-semibold'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Right: New Quote + User */}
          <div className="flex items-center gap-3">
            <Link
              href="/quotes/create"
              data-testid="nav-new-quote"
              className="hidden sm:inline-flex items-center gap-2 h-9 px-4 bg-blueprint text-white text-sm font-semibold rounded-lg hover:bg-blueprint-700 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              New Quote
            </Link>
            {userEmail && (
              <span className="hidden md:block text-xs text-slate-400 max-w-[140px] truncate">
                {userEmail}
              </span>
            )}
            <button
              onClick={handleSignOut}
              data-testid="nav-signout"
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav Dropdown */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-1 animate-fade-in">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-blueprint-50 text-blueprint'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {item.label}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </Link>
            )
          })}
          <Link
            href="/quotes/create"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-blueprint"
          >
            <PlusCircle className="w-4 h-4" />
            New Quote
          </Link>
        </div>
      )}

      {/* Content */}
      <main className="flex-1">{children}</main>
    </div>
  )
}
