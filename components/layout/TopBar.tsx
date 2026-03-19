'use client'

import { Bell, Settings, User, Menu } from 'lucide-react'

export function TopBar() {
  return (
    <header
      data-testid="top-bar"
      className="sticky top-0 z-50 h-14 bg-[var(--bg-surface)] border-b border-[var(--border)] px-6 flex items-center justify-between"
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <div
          data-testid="logo"
          className="w-7 h-7 rounded-md bg-[var(--accent)] flex items-center justify-center"
        >
          <span className="text-white font-bold text-xs">T</span>
        </div>
        <div
          data-testid="flag"
          className="w-6 h-4 rounded-sm bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center overflow-hidden"
        >
          <span className="text-[8px] text-[var(--text-muted)]">EN</span>
        </div>
        <span className="font-semibold text-sm text-[var(--text-primary)] tracking-tight">TradeLife</span>
        <span className="text-[11px] font-medium text-[var(--text-muted)] ml-1">Command Center</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        <button
          data-testid="notifications-button"
          className="w-8 h-8 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
        >
          <Bell className="w-4 h-4" />
        </button>
        <button
          data-testid="settings-button"
          className="w-8 h-8 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
        >
          <Settings className="w-4 h-4" />
        </button>
        <button
          data-testid="menu-button"
          className="w-8 h-8 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div
          data-testid="user-avatar"
          className="w-7 h-7 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-strong)] flex items-center justify-center ml-2"
        >
          <User className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
        </div>
      </div>
    </header>
  )
}
