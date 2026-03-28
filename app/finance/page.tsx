import { getSupabaseServerClient } from '@/lib/supabase/server-safe'

export default async function FinancePage() {
  const hasSupabaseEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  if (!hasSupabaseEnv) {
    return <FinanceState invoices={[]} />
  }

  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase.from('invoices').select('*')

  if (error) {
    return <FinanceState invoices={[]} error />
  }

  return <FinanceState invoices={data ?? []} />
}

function FinanceState({ invoices, error = false }: { invoices: any[]; error?: boolean }) {
  const totalRevenue = invoices.reduce((sum: number, invoice: any) => sum + Number(invoice.total || 0), 0)
  const averageInvoice = invoices.length ? Math.round(totalRevenue / invoices.length) : 0

  return (
    <section className="mx-auto max-w-4xl space-y-6" data-testid="finance-page">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.28em] text-neutral-500" data-testid="finance-page-kicker">Overview</p>
        <h1 className="text-3xl font-semibold text-white" data-testid="finance-page-title">Finance</h1>
        <p className="text-sm text-neutral-400" data-testid="finance-page-description">Monitor billed revenue and invoice volume from one clean summary.</p>
      </div>

      {error ? (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8" data-testid="finance-error-state">
          <p className="text-sm text-red-200">We couldn&apos;t load finance data right now.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3" data-testid="finance-summary-grid">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5" data-testid="finance-card-revenue">
            <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">Revenue</p>
            <p className="mt-3 text-2xl font-semibold text-white">£{totalRevenue}</p>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5" data-testid="finance-card-invoices">
            <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">Invoices</p>
            <p className="mt-3 text-2xl font-semibold text-white">{invoices.length}</p>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5" data-testid="finance-card-average">
            <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">Average Invoice</p>
            <p className="mt-3 text-2xl font-semibold text-white">£{averageInvoice}</p>
          </div>
        </div>
      )}
    </section>
  )
}
