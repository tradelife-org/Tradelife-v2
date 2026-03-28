'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/quotes', label: 'Quotes' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/invoices', label: 'Invoices' },
  { href: '/clients', label: 'Clients' },
  { href: '/finance', label: 'Finance' },
  { href: '/settings', label: 'Settings' },
]

const SHELLED_ROUTES = ['/', '/dashboard', '/quotes', '/jobs', '/invoices', '/clients', '/finance', '/settings']

function isShelledRoute(pathname: string) {
  return SHELLED_ROUTES.some(route => (route === '/' ? pathname === '/' : pathname.startsWith(route)))
}

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (!isShelledRoute(pathname)) {
    return <>{children}</>
  }

  return (
    <div
      className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.16),transparent_32%),linear-gradient(180deg,#0a0a0a_0%,#0f0f10_45%,#09090b_100%)]"
      data-testid="app-frame"
    >
      <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-xl" data-testid="top-navigation">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-full border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm font-semibold tracking-[0.18em] text-white transition-colors hover:border-neutral-700 hover:bg-neutral-800"
              data-testid="app-brand-link"
            >
              TradeLife
            </Link>
            <span className="hidden text-sm text-neutral-500 sm:inline" data-testid="app-shell-tagline">
              Job management for modern trade businesses
            </span>
          </div>

          <nav className="flex flex-wrap items-center gap-2" data-testid="primary-navigation-links">
            {NAV_ITEMS.map(item => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'border-blue-500/60 bg-blue-500/15 text-white'
                      : 'border-neutral-800 bg-neutral-900/70 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-800 hover:text-white'
                  }`}
                  data-testid={`nav-link-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8" data-testid="app-main-content">
        {children}
      </main>
    </div>
  )
}