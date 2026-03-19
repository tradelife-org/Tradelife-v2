'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ClassifiedTransaction {
  id: string
  merchant: string
  amount: number
  description: string
  date: string
  type: 'business' | 'personal'
  category: string
  confidence: number
}

const MOCK_TRANSACTIONS = [
  { id: 'tx-1', merchant: 'Screwfix', amount: 120, description: 'Screwfix Direct', date: '2025-01-15' },
  { id: 'tx-2', merchant: 'Tesco', amount: 45, description: 'Tesco Superstore', date: '2025-01-15' },
  { id: 'tx-3', merchant: 'Shell', amount: 60, description: 'Shell Fuel Station', date: '2025-01-14' },
  { id: 'tx-4', merchant: 'Amazon', amount: 30, description: 'Amazon.co.uk', date: '2025-01-14' },
]

export default function DashboardPage() {
  const router = useRouter()
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState<ClassifiedTransaction[]>([])

  const businessCount = transactions.filter((t) => t.type === 'business').length
  const personalCount = transactions.filter((t) => t.type === 'personal').length
  const reviewCount = transactions.filter((t) => t.confidence < 0.7).length

  async function handleConnectBank() {
    setLoading(true)
    try {
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: MOCK_TRANSACTIONS }),
      })
      const data = await res.json()
      if (data.transactions) {
        setTransactions(data.transactions)
        setConnected(true)

        // Save classified transactions
        await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactions: data.transactions }),
        })
      }
    } catch (err) {
      console.error('Failed to classify:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-heading font-bold text-slate-900 mb-1" data-testid="dashboard-heading">
          Dashboard
        </h1>
        <p className="text-slate-500 text-sm mb-8">Manage your trade finances</p>

        {!connected ? (
          <div
            className="bg-white border border-slate-200 rounded-lg p-6"
            data-testid="connect-bank-card"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blueprint-50 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-blueprint-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-heading font-bold text-slate-900">Connect your bank</h2>
                <p className="text-sm text-slate-500 mt-1 mb-4">
                  Link your bank account to automatically import and classify transactions.
                </p>
                <button
                  onClick={handleConnectBank}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-lg bg-blueprint-600 text-white text-sm font-medium hover:bg-blueprint-700 disabled:opacity-50 transition-colors"
                  data-testid="connect-bank-button"
                >
                  {loading ? 'Connecting...' : 'Connect Bank'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4" data-testid="classification-results">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-slate-200 rounded-lg p-4" data-testid="business-count-card">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Business</div>
                <div className="text-2xl font-heading font-bold text-emerald-600">{businessCount}</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4" data-testid="personal-count-card">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Personal</div>
                <div className="text-2xl font-heading font-bold text-blueprint-600">{personalCount}</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4" data-testid="review-count-card">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Review</div>
                <div className="text-2xl font-heading font-bold text-amber-500">{reviewCount}</div>
              </div>
            </div>

            {/* Transaction list */}
            <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
              {transactions.map((tx) => (
                <div key={tx.id} className="px-4 py-3 flex items-center justify-between" data-testid={`transaction-${tx.id}`}>
                  <div>
                    <span className="font-medium text-slate-800">{tx.merchant}</span>
                    <span className="text-slate-400 mx-2">-</span>
                    <span className="text-sm text-slate-500">{tx.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-slate-700">{'\u00A3'}{tx.amount}</span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        tx.type === 'business'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {tx.type}
                    </span>
                    {tx.confidence < 0.7 && (
                      <span className="text-xs text-amber-500 font-medium">Needs review</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push('/transactions/review')}
              className="w-full py-3 rounded-lg bg-blueprint-600 text-white font-medium hover:bg-blueprint-700 transition-colors"
              data-testid="review-transactions-button"
            >
              Review Transactions
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
