'use client'

import { supabase } from "@/lib/supabase/client"
import * as React from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import {
  FileText, Briefcase, Settings, LogOut,
  PlusCircle, Menu, X, ChevronRight,
  Calendar, Users, BarChart2,
  Bell, CheckCircle, MessageSquare, TrendingUp
} from 'lucide-react'
import NotificationBell from '@/components/notification-bell'

// ADDED IMPORT REVIEW LINK FOR ONBOARDING
const NAV_ITEMS = [
  { href: '/quotes', label: 'Quotes', icon: FileText },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/calendar', label: 'Schedule', icon: Calendar },
  { href: '/finance', label: 'Finance', icon: BarChart2 },
  { href: '/analytics', label: 'Growth', icon: TrendingUp },
  { href: '/assistant', label: 'Assistant', icon: MessageSquare },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [userEmail, setUserEmail] = React.useState<string | null>(null)

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserEmail(user.email ?? null)
    })
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
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
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto no-scrollbar" data-testid="desktop-nav">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Right: New Quote + User */}
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <Link
              href="/quotes/create"
              data-testid="nav-new-quote"
              className="hidden sm:inline-flex items-center gap-2 h-9 px-4 bg-blueprint text-white text-sm font-semibold rounded-lg hover:bg-blueprint-700 transition-colors shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              New Quote
            </Link>
            <button
              onClick={handleSignOut}
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
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-1 animate-fade-in fixed top-14 left-0 right-0 z-40 shadow-xl max-h-[80vh] overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  {item.label}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </Link>
            )
          })}
        </div>
      )}

      {/* Content */}
      <main className="flex-1">{children}</main>
    </div>
  )
}
