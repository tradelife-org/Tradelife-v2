'use client'

import { useState } from 'react'
import { Bell, Settings, User, Menu, X } from 'lucide-react'
import Link from 'next/link'

const NAV_LINKS = [
  { href: '/', label: 'Dashboard' },
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
        className="sticky top-0 z-50 h-14 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            data-testid="menu-button"
            onClick={() => setOpen(!open)}
            className="lg:hidden w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          >
            {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <Link href="/" data-testid="logo" className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">T</span>
          </Link>
          <span className="font-semibold text-sm text-gray-900 tracking-tight">TradeLife</span>

          <nav className="hidden lg:flex items-center gap-1 ml-6" data-testid="desktop-nav">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                data-testid={`nav-link-${link.label.toLowerCase()}`}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <button
            data-testid="notifications-button"
            className="w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          >
            <Bell className="w-4 h-4" />
          </button>
          <button
            data-testid="settings-button"
            className="hidden lg:flex w-8 h-8 rounded-md items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          >
            <Settings className="w-4 h-4" />
          </button>
          <div
            data-testid="user-avatar"
            className="w-7 h-7 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center ml-1.5 sm:ml-2"
          >
            <User className="w-3.5 h-3.5 text-gray-500" />
          </div>
        </div>
      </header>

      {open && (
        <nav
          data-testid="mobile-menu"
          className="lg:hidden fixed inset-x-0 top-14 z-40 bg-white border-b border-gray-200 shadow-lg"
        >
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                data-testid={`mobile-nav-link-${link.label.toLowerCase()}`}
                className="block px-3 py-2.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
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
