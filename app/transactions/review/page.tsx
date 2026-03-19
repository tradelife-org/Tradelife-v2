'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

interface Transaction {
  id: string; merchant: string; amount: number; description: string; date: string
  type: 'business' | 'personal'; category: string; confidence: number
}

export default function ReviewPage() {
  const router = useRouter()
  const [orgId, setOrgId] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  const loadTransactions = useCallback(async (oid: string) => {
    try {
      const res = await fetch(`/api/transactions?org_id=${oid}`)
      const data = await res.json()
      if (data.transactions) setTransactions(data.transactions)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me'); const data = await res.json()
        if (data.user?.org_id) { setOrgId(data.user.org_id); await loadTransactions(data.user.org_id) }
        else setLoading(false)
      } catch { setLoading(false) }
    })()
  }, [loadTransactions])

  async function handleClassify(txId: string, type: 'business' | 'personal') {
    setSaving(txId)
    const tx = transactions.find(t => t.id === txId)
    if (!tx) { setSaving(null); return }
    const category = type === 'business' ? 'business expense' : 'personal expense'
    setTransactions(prev => prev.map(t => t.id === txId ? { ...t, type, category, confidence: 1.0 } : t))
    try {
      await fetch('/api/transactions', { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: txId, type, category, confidence: 1.0 }) })
      if (orgId) await fetch('/api/user-rules', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchant: tx.merchant.toLowerCase(), type, category, org_id: orgId }) })
    } catch {} finally { setSaving(null) }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }} data-testid="loading-text">Loading transactions...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Top Bar */}
      <header className="sticky top-0 z-50 px-4 md:px-6 h-14 flex items-center justify-between"
        style={{ background: 'rgba(var(--bg-base-rgb), 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'var(--glow-primary)' }}>
            <span className="text-white font-bold text-xs">T</span>
          </div>
          <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>TradeLife</span>
        </div>
        <button onClick={() => router.push('/dashboard')} className="text-xs font-medium" style={{ color: 'var(--glow-primary)' }} data-testid="back-to-dashboard">
          Back to Dashboard
        </button>
      </header>

      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }} data-testid="review-heading">Review Transactions</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Classify each transaction as business or personal</p>

          {transactions.length === 0 ? (
            <div className="glass-panel p-8 text-center" data-testid="no-transactions">
              <p style={{ color: 'var(--text-muted)' }}>No transactions to review.</p>
              <button onClick={() => router.push('/dashboard')} className="mt-4 text-xs font-medium" style={{ color: 'var(--glow-primary)' }} data-testid="go-to-dashboard">Go to Dashboard</button>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx, i) => (
                <motion.div key={tx.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="glass-panel p-4" data-testid={`review-item-${tx.id}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{ background: 'rgba(var(--surface-elevated-rgb), 0.8)', color: 'var(--text-secondary)' }}>{tx.merchant[0]}</div>
                      <div>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }} data-testid={`review-merchant-${tx.id}`}>{tx.merchant}</span>
                        <span className="text-[10px] ml-2" style={{ color: 'var(--text-muted)' }}>{tx.date?.split('T')[0]}</span>
                      </div>
                    </div>
                    <span className="text-sm font-mono" style={{ color: 'var(--text-primary)' }} data-testid={`review-amount-${tx.id}`}>{'\u00A3'}{tx.amount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleClassify(tx.id, 'business')} disabled={saving === tx.id}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: tx.type === 'business' && tx.confidence === 1.0 ? 'var(--success)' : 'rgba(16,185,129,0.08)',
                        color: tx.type === 'business' && tx.confidence === 1.0 ? '#fff' : 'var(--success)',
                        border: `1px solid ${tx.type === 'business' && tx.confidence === 1.0 ? 'var(--success)' : 'rgba(16,185,129,0.2)'}`,
                      }} data-testid={`classify-business-${tx.id}`}>Business</button>
                    <button onClick={() => handleClassify(tx.id, 'personal')} disabled={saving === tx.id}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: tx.type === 'personal' && tx.confidence === 1.0 ? 'var(--glow-primary)' : 'rgba(var(--glow-primary-rgb),0.08)',
                        color: tx.type === 'personal' && tx.confidence === 1.0 ? '#fff' : 'var(--glow-primary)',
                        border: `1px solid ${tx.type === 'personal' && tx.confidence === 1.0 ? 'var(--glow-primary)' : 'rgba(var(--glow-primary-rgb),0.2)'}`,
                      }} data-testid={`classify-personal-${tx.id}`}>Personal</button>
                  </div>
                  {tx.confidence < 1.0 && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: tx.confidence >= 0.9 ? 'var(--success)' : tx.confidence >= 0.7 ? 'var(--warning)' : 'var(--danger)' }} />
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {tx.confidence >= 0.9 ? 'Auto-classified' : tx.confidence >= 0.7 ? 'Suggested' : 'Needs review'} ({Math.round(tx.confidence * 100)}%)
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </main>
  )
}
