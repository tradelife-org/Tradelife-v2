'use client'

import { useState } from 'react'
import { Bell, Settings, User, Menu, X } from 'lucide-react'
import Link from 'next/link'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/quotes', label: 'Quotes' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/invoices', label: 'Invoices' },
  { href: '/clients', label: 'Clients' },
  { href: '/finance', label: 'Finance' },
  { href: '/settings', label: 'Settings' },
]

export function TopBar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <header
        data-testid="top-bar"
        className="sticky top-0 z-50 h-14 topbar-material px-4 sm:px-6 flex items-center justify-between"
      >
        {/* Left — burger on mobile, full brand on desktop */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Burger — mobile */}
          <button
            data-testid="menu-button"
            onClick={() => setOpen(!open)}
            className="lg:hidden w-8 h-8 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
          >
            {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          {/* Logo + brand */}
          <Link href="/dashboard" data-testid="logo" className="w-7 h-7 rounded-md bg-[var(--accent)] flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">T</span>
          </Link>
          <div
            data-testid="flag"
            className="w-5 h-3.5 sm:w-6 sm:h-4 rounded-sm bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center overflow-hidden"
          >
            <span className="text-[7px] sm:text-[8px] text-[var(--text-muted)]">EN</span>
          </div>
          <span className="font-semibold text-sm text-[var(--text-primary)] tracking-tight">TradeLife</span>
          <span className="hidden lg:inline text-[11px] font-medium text-[var(--text-muted)] ml-1">Command Center</span>

          {/* Desktop inline nav */}
          <nav className="hidden lg:flex items-center gap-1 ml-6" data-testid="desktop-nav">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                data-testid={`nav-link-${link.label.toLowerCase()}`}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right — notification + avatar */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          <button
            data-testid="notifications-button"
            className="w-8 h-8 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
          >
            <Bell className="w-4 h-4" />
          </button>
          <button
            data-testid="settings-button"
            className="hidden lg:flex w-8 h-8 rounded-md items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
          >
            <Settings className="w-4 h-4" />
          </button>
          <div
            data-testid="user-avatar"
            className="w-7 h-7 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-strong)] flex items-center justify-center ml-1.5 sm:ml-2"
          >
            <User className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {open && (
        <nav
          data-testid="mobile-menu"
          className="lg:hidden fixed inset-x-0 top-14 z-40 bg-[var(--bg-base)] border-b border-[var(--border)] shadow-lg"
        >
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                data-testid={`mobile-nav-link-${link.label.toLowerCase()}`}
                className="block px-3 py-2.5 rounded-md text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </>
  )
}
