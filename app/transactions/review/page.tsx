'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Transaction {
  id: string
  merchant: string
  amount: number
  description: string
  date: string
  type: 'business' | 'personal'
  category: string
  confidence: number
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
      if (data.transactions) {
        setTransactions(data.transactions)
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (data.user?.org_id) {
          setOrgId(data.user.org_id)
          await loadTransactions(data.user.org_id)
        } else {
          setLoading(false)
        }
      } catch {
        setLoading(false)
      }
    }
    init()
  }, [loadTransactions])

  async function handleClassify(txId: string, type: 'business' | 'personal') {
    setSaving(txId)
    const tx = transactions.find((t) => t.id === txId)
    if (!tx) { setSaving(null); return }

    const category = type === 'business' ? 'business expense' : 'personal expense'

    // Optimistic local update
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === txId ? { ...t, type, category, confidence: 1.0 } : t
      )
    )

    try {
      // Update transaction in Supabase
      await fetch('/api/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: txId, type, category, confidence: 1.0 }),
      })

      // Insert/update user rule in Supabase
      if (orgId) {
        await fetch('/api/user-rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merchant: tx.merchant.toLowerCase(),
            type,
            category,
            org_id: orgId,
          }),
        })
      }
    } catch (err) {
      console.error('Failed to save classification:', err)
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500" data-testid="loading-text">Loading transactions...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-slate-900" data-testid="review-heading">
              Review Transactions
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Classify each transaction as business or personal
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-blueprint-600 hover:text-blueprint-700 font-medium"
            data-testid="back-to-dashboard"
          >
            Back to Dashboard
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center" data-testid="no-transactions">
            <p className="text-slate-500">No transactions to review.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 text-sm text-blueprint-600 hover:text-blueprint-700 font-medium"
              data-testid="go-to-dashboard"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-white border border-slate-200 rounded-lg p-4"
                data-testid={`review-item-${tx.id}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-medium text-slate-800" data-testid={`review-merchant-${tx.id}`}>
                      {tx.merchant}
                    </span>
                    <span className="text-sm text-slate-400 ml-2">{tx.date}</span>
                  </div>
                  <span className="text-sm font-mono text-slate-700" data-testid={`review-amount-${tx.id}`}>
                    {'\u00A3'}{tx.amount}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleClassify(tx.id, 'business')}
                    disabled={saving === tx.id}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      tx.type === 'business' && tx.confidence === 1.0
                        ? 'bg-emerald-600 text-white'
                        : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                    }`}
                    data-testid={`classify-business-${tx.id}`}
                  >
                    Business
                  </button>
                  <button
                    onClick={() => handleClassify(tx.id, 'personal')}
                    disabled={saving === tx.id}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      tx.type === 'personal' && tx.confidence === 1.0
                        ? 'bg-blueprint-600 text-white'
                        : 'border border-blueprint-200 text-blueprint-700 hover:bg-blueprint-50'
                    }`}
                    data-testid={`classify-personal-${tx.id}`}
                  >
                    Personal
                  </button>
                </div>

                {tx.confidence < 1.0 && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      tx.confidence >= 0.9 ? 'bg-emerald-400' :
                      tx.confidence >= 0.7 ? 'bg-amber-400' : 'bg-red-400'
                    }`} />
                    <span className="text-xs text-slate-400">
                      {tx.confidence >= 0.9 ? 'Auto-classified' :
                       tx.confidence >= 0.7 ? 'Suggested' : 'Needs review'}
                      {' '}({Math.round(tx.confidence * 100)}%)
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
