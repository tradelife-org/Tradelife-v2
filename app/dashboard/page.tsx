'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useThemeStore, type ThemeName } from '@/lib/stores/theme-store'

interface ClassifiedTransaction {
  id: string; merchant: string; amount: number; description: string; date: string
  type: 'business' | 'personal'; category: string; confidence: number
}

const MOCK_TRANSACTIONS = [
  { id: crypto.randomUUID(), merchant: 'Screwfix', amount: 120, description: 'Screwfix Direct', date: '2025-01-15' },
  { id: crypto.randomUUID(), merchant: 'Tesco', amount: 45, description: 'Tesco Superstore', date: '2025-01-15' },
  { id: crypto.randomUUID(), merchant: 'Shell', amount: 60, description: 'Shell Fuel Station', date: '2025-01-14' },
  { id: crypto.randomUUID(), merchant: 'Amazon', amount: 30, description: 'Amazon.co.uk', date: '2025-01-14' },
]

const THEMES: { key: ThemeName; label: string }[] = [
  { key: 'molten', label: 'Command' },
  { key: 'commercial', label: 'Professional' },
  { key: 'remembrance', label: 'Respect' },
]

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`glass-panel p-4 ${className}`}>{children}</div>
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>{children}</h3>
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="glass-panel p-4 text-center">
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { theme, setTheme } = useThemeStore()
  const [orgId, setOrgId] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [transactions, setTransactions] = useState<ClassifiedTransaction[]>([])
  const [showSettings, setShowSettings] = useState(false)

  const businessCount = transactions.filter(t => t.type === 'business').length
  const personalCount = transactions.filter(t => t.type === 'personal').length
  const reviewCount = transactions.filter(t => t.confidence < 0.7).length
  const totalAmount = transactions.reduce((s, t) => s + t.amount, 0)
  const businessAmount = transactions.filter(t => t.type === 'business').reduce((s, t) => s + t.amount, 0)

  const loadTransactions = useCallback(async (oid: string) => {
    try {
      const res = await fetch(`/api/transactions?org_id=${oid}`)
      const data = await res.json()
      if (data.transactions?.length > 0) { setTransactions(data.transactions); setConnected(true) }
    } catch {}
  }, [])

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me'); const data = await res.json()
        if (data.user?.org_id) { setOrgId(data.user.org_id); await loadTransactions(data.user.org_id) }
      } catch {} finally { setPageLoading(false) }
    })()
  }, [loadTransactions])

  async function handleConnectBank() {
    setLoading(true)
    try {
      const res = await fetch('/api/classify', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: MOCK_TRANSACTIONS, org_id: orgId }) })
      const data = await res.json()
      if (data.transactions) {
        const saveRes = await fetch('/api/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactions: data.transactions, org_id: orgId }) })
        const saved = await saveRes.json()
        setTransactions(saved.transactions || data.transactions); setConnected(true)
      }
    } catch {} finally { setLoading(false) }
  }

  if (pageLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full animate-pulse" style={{ background: 'var(--glow-primary)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading command center...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen relative" style={{ background: 'var(--bg-base)' }}>
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-[0.04] pointer-events-none"
        style={{ background: `radial-gradient(ellipse, var(--glow-primary), transparent 70%)` }} />

      {/* Top Bar */}
      <header className="sticky top-0 z-50 px-4 md:px-6 h-14 flex items-center justify-between"
        style={{ background: 'rgba(var(--bg-base-rgb), 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'var(--glow-primary)' }}>
            <span className="text-white font-bold text-xs">T</span>
          </div>
          <span className="font-bold text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>TradeLife</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full ml-1" style={{ color: 'var(--glow-primary)', background: 'rgba(var(--glow-primary-rgb), 0.1)' }}>
            Command Center
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Settings */}
          <button onClick={() => setShowSettings(!showSettings)} data-testid="settings-button"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: showSettings ? 'rgba(var(--glow-primary-rgb), 0.15)' : 'transparent', color: 'var(--text-secondary)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </button>
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: 'rgba(var(--glow-primary-rgb), 0.15)', color: 'var(--glow-primary)' }}>U</div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="fixed top-14 right-4 z-50 w-64 glass-panel-elevated p-4" data-testid="settings-panel">
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Appearance</h4>
          <div className="space-y-1.5">
            {THEMES.map(t => (
              <button key={t.key} onClick={() => setTheme(t.key)} data-testid={`theme-switch-${t.key}`}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-all"
                style={{ background: theme === t.key ? 'rgba(var(--glow-primary-rgb), 0.1)' : 'transparent', color: theme === t.key ? 'var(--glow-primary)' : 'var(--text-secondary)' }}>
                <div className="w-3 h-3 rounded-full" style={{ background: t.key === 'molten' ? '#f97316' : t.key === 'commercial' ? '#3b82f6' : '#dc2626' }} />
                <span className="font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* 3-Column Grid */}
      <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4" data-testid="dashboard-heading">
        {/* LEFT PANEL */}
        <div className="lg:col-span-3 space-y-4">
          <GlassCard>
            <SectionTitle>Attention Needed</SectionTitle>
            {reviewCount > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(245,158,11,0.08)' }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--warning)' }} />
                  <span style={{ color: 'var(--text-primary)' }}>{reviewCount} transactions need review</span>
                </div>
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No items need attention</p>
            )}
          </GlassCard>

          <GlassCard>
            <SectionTitle>Active Projects</SectionTitle>
            <div className="space-y-2">
              {['Kitchen Renovation', 'Office Fit-Out'].map(p => (
                <div key={p} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'rgba(var(--surface-elevated-rgb), 0.5)' }}>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{p}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color: 'var(--glow-primary)', background: 'rgba(var(--glow-primary-rgb), 0.1)' }}>Active</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <SectionTitle>Active Trades</SectionTitle>
            <div className="space-y-2">
              {['Plumbing', 'Electrical'].map(t => (
                <div key={t} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(var(--surface-elevated-rgb), 0.5)' }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: 'var(--success)' }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{t}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* CENTER PANEL */}
        <div className="lg:col-span-6 space-y-4">
          {/* AI Core */}
          <GlassCard className="edge-glow text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 edge-glow-strong"
              style={{ background: 'rgba(var(--glow-primary-rgb), 0.1)' }}>
              <div className="w-6 h-6 rounded-full" style={{ background: 'var(--glow-primary)', boxShadow: `0 0 16px rgba(var(--glow-primary-rgb), 0.5)` }} />
            </div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>AI Classification Engine</h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Intelligent transaction analysis active</p>
          </GlassCard>

          {/* Quick Actions */}
          {!connected ? (
            <GlassCard data-testid="connect-bank-card">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(var(--glow-primary-rgb), 0.1)' }}>
                  <svg className="w-5 h-5" style={{ color: 'var(--glow-primary)' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Connect your bank</h3>
                  <p className="text-xs mt-1 mb-3" style={{ color: 'var(--text-secondary)' }}>Import and classify transactions automatically</p>
                  <button onClick={handleConnectBank} disabled={loading} className="btn-glow px-5 py-2 text-xs" data-testid="connect-bank-button">
                    {loading ? 'Connecting...' : 'Connect Bank'}
                  </button>
                </div>
              </div>
            </GlassCard>
          ) : (
            <div data-testid="classification-results">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <StatCard label="Business" value={businessCount} color="var(--success)" />
                <StatCard label="Personal" value={personalCount} color="var(--glow-primary)" />
                <StatCard label="Review" value={reviewCount} color="var(--warning)" />
              </div>

              {/* Transactions */}
              <GlassCard className="!p-0 overflow-hidden">
                <div className="px-4 pt-3 pb-2"><SectionTitle>Recent Transactions</SectionTitle></div>
                <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                  {transactions.slice(0, 6).map(tx => (
                    <div key={tx.id} className="px-4 py-3 flex items-center justify-between" data-testid={`transaction-${tx.id}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{ background: 'rgba(var(--surface-elevated-rgb), 0.8)', color: 'var(--text-secondary)' }}>
                          {tx.merchant[0]}
                        </div>
                        <div>
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{tx.merchant}</span>
                          <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>{tx.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{'\u00A3'}{tx.amount}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: tx.type === 'business' ? 'rgba(16,185,129,0.1)' : 'rgba(var(--glow-primary-rgb),0.1)',
                            color: tx.type === 'business' ? 'var(--success)' : 'var(--glow-primary)' }}>
                          {tx.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <button onClick={() => router.push('/transactions/review')} className="btn-glow w-full py-3 text-sm mt-4" data-testid="review-transactions-button">
                Review Transactions
              </button>
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="lg:col-span-3 space-y-4">
          <GlassCard>
            <SectionTitle>Schedule</SectionTitle>
            <div className="space-y-2">
              {[{ t: '09:00', l: 'Site visit — Unit 4' }, { t: '14:00', l: 'Client call — Smith' }].map(s => (
                <div key={s.t} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(var(--surface-elevated-rgb), 0.5)' }}>
                  <span className="text-[10px] font-mono font-medium" style={{ color: 'var(--glow-primary)' }}>{s.t}</span>
                  <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{s.l}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <SectionTitle>Urgent Tasks</SectionTitle>
            <div className="space-y-2">
              {['Submit VAT return', 'Chase invoice #042'].map(t => (
                <div key={t} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(var(--surface-elevated-rgb), 0.5)' }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--danger)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{t}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <SectionTitle>Financial Overview</SectionTitle>
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total</span>
                <span className="text-lg font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{'\u00A3'}{totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Business</span>
                <span className="text-sm font-mono font-semibold" style={{ color: 'var(--success)' }}>{'\u00A3'}{businessAmount.toLocaleString()}</span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                <div className="h-full rounded-full" style={{ background: 'var(--success)', width: totalAmount > 0 ? `${(businessAmount / totalAmount) * 100}%` : '0%' }} />
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </main>
  )
}
