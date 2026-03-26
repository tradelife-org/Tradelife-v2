import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function QuotesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()

  const { data: quotes } = await supabase
    .from('quotes')
    .select('id, reference, status, quote_amount_net, quote_profit, created_at, clients ( name )')
    .eq('org_id', profile?.org_id)
    .order('created_at', { ascending: false })

  const formatPence = (p: number) =>
    '£' + (p / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const statusColor: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-600',
    SENT: 'bg-blue-100 text-blue-700',
    ACCEPTED: 'bg-emerald-100 text-emerald-700',
    DECLINED: 'bg-red-100 text-red-700',
  }

  return (
    <div className="max-w-5xl mx-auto" data-testid="quotes-page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900" data-testid="quotes-heading">Quotes</h1>
        <Link
          href="/quotes/create"
          data-testid="create-quote-button"
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Quote
        </Link>
      </div>

      {!quotes || quotes.length === 0 ? (
        <p className="text-gray-500 text-sm" data-testid="no-quotes-message">No quotes yet. Create your first quote.</p>
      ) : (
        <div className="space-y-2" data-testid="quotes-list">
          {quotes.map((q: any) => (
            <Link
              key={q.id}
              href={`/quotes/${q.id}`}
              data-testid={`quote-row-${q.id}`}
              className="flex items-center justify-between p-4 rounded-lg bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {q.reference || `Quote #${q.id.slice(0, 8)}`}
                  </p>
                  <p className="text-xs text-gray-500">{(q as any).clients?.name || 'No client'}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor[q.status] || 'bg-slate-100 text-slate-500'}`}>
                  {q.status}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-medium text-gray-900">{formatPence(q.quote_amount_net)}</p>
                <p className="text-xs font-mono text-gray-500">Profit: {formatPence(q.quote_profit)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
