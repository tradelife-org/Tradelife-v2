'use client'

import { supabase } from "@/lib/supabase/client"
import * as React from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  Wallet, TrendingUp, TrendingDown, Clock,
  DollarSign, CheckCircle
} from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/actions/quotes'

interface JobFinancialsProps {
  jobId: string
  orgId: string
}

interface LedgerEntry {
  id: string
  amount: number
  transaction_type: 'CREDIT' | 'DEBIT'
  category: 'REVENUE' | 'EXPENSE' | 'TAX'
  description: string
  created_at: string
}

interface FinancialSummary {
  revenue_recognized: number
  invoiced_total: number
  expenses_total: number
  balance: number
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

export default function JobFinancials({ jobId, orgId }: JobFinancialsProps) {
  const [ledger, setLedger] = React.useState<LedgerEntry[]>([])
  const [summary, setSummary] = React.useState<FinancialSummary>({
    revenue_recognized: 0,
    invoiced_total: 0,
    expenses_total: 0,
    balance: 0
  })
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchFinancials() {
      // supabase used
      
      const { data, error } = await supabase
        .from('job_wallet_ledger')
        .select('*')
        .eq('job_id', jobId)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setLedger(data as LedgerEntry[])
        
        // Calculate Summary
        let rev = 0
        let inv = 0 // If we track invoices separately in ledger? Or categorize them?
        // Category: REVENUE, EXPENSE, TAX.
        // Usually: Revenue = Total Contract Value (Recognized)
        // Invoiced = Actual Bills Sent (might be tracked via invoice table, or ledger event?)
        // Ledger description might say "Invoice Issued"?
        // For now, let's sum based on Category/Type.
        
        let exp = 0
        let bal = 0 // Wallet Balance (Realized Cash?) or Theoretical?
        // Usually Wallet Balance = In - Out.
        
        data.forEach((entry: LedgerEntry) => {
           if (entry.category === 'REVENUE') {
               rev += entry.amount
           } else if (entry.category === 'EXPENSE') {
               exp += entry.amount
           }
           
           if (entry.transaction_type === 'CREDIT') {
               bal += entry.amount
           } else {
               bal -= entry.amount
           }
        })
        
        setSummary({
            revenue_recognized: rev,
            invoiced_total: 0, // Need to join invoices table or infer?
            expenses_total: exp,
            balance: bal
        })
      }
      setLoading(false)
    }

    fetchFinancials()
  }, [jobId, orgId])

  if (loading) return <div className="animate-pulse h-32 bg-slate-50 rounded-xl" />

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-green-50 rounded-lg text-green-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Revenue Recognized</span>
           </div>
           <p className="text-2xl font-mono font-bold text-slate-900">
             {formatCurrency(summary.revenue_recognized)}
           </p>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-red-50 rounded-lg text-red-600">
                <TrendingDown className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Expenses</span>
           </div>
           <p className="text-2xl font-mono font-bold text-slate-900">
             {formatCurrency(summary.expenses_total)}
           </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-blueprint-50 rounded-lg text-blueprint">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Wallet Balance</span>
           </div>
           <p className={`text-2xl font-mono font-bold ${summary.balance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
             {formatCurrency(summary.balance)}
           </p>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
           <h3 className="font-heading font-semibold text-slate-900">Transaction Ledger</h3>
           <span className="text-xs text-slate-400">{ledger.length} entries</span>
        </div>
        
        {ledger.length === 0 ? (
           <div className="p-8 text-center text-slate-400 text-sm">
             No transactions recorded yet.
           </div>
        ) : (
           <table className="w-full text-sm text-left">
             <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-xs">
               <tr>
                 <th className="px-6 py-3">Date</th>
                 <th className="px-6 py-3">Description</th>
                 <th className="px-6 py-3">Category</th>
                 <th className="px-6 py-3 text-right">Amount</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
               {ledger.map((entry) => (
                 <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                   <td className="px-6 py-3 text-slate-500 whitespace-nowrap">
                     {formatDate(entry.created_at)}
                   </td>
                   <td className="px-6 py-3 text-slate-700 font-medium">
                     {entry.description}
                   </td>
                   <td className="px-6 py-3">
                     <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                       ${entry.category === 'REVENUE' ? 'bg-green-100 text-green-700' : 
                         entry.category === 'EXPENSE' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}
                     `}>
                       {entry.category}
                     </span>
                   </td>
                   <td className={`px-6 py-3 text-right font-mono font-semibold 
                     ${entry.transaction_type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}
                   `}>
                     {entry.transaction_type === 'CREDIT' ? '+' : '-'}{formatCurrency(entry.amount)}
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
        )}
      </div>
    </div>
  )
}
