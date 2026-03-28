import Link from 'next/link'
import { getSupabaseServerClient } from '@/lib/supabase/server-safe'

export default async function InvoicesPage() {
  const hasSupabaseEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  if (!hasSupabaseEnv) {
    return <InvoicesState invoices={[]} />
  }

  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase.from('invoices').select('*')

  if (error) {
    return <InvoicesState invoices={[]} error />
  }

  return <InvoicesState invoices={data ?? []} />
}

function InvoicesState({ invoices, error = false }: { invoices: any[]; error?: boolean }) {
  return (
    <section className="mx-auto max-w-4xl space-y-6" data-testid="invoices-page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-neutral-500" data-testid="invoices-page-kicker">Billing</p>
          <h1 className="text-3xl font-semibold text-white" data-testid="invoices-page-title">Invoices</h1>
          <p className="text-sm text-neutral-400" data-testid="invoices-page-description">Keep invoices visible, organised, and ready to send.</p>
        </div>

        <Link href="/invoices/create" className="inline-flex items-center justify-center rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700" data-testid="create-invoice-button">
          Create Invoice
        </Link>
      </div>

      {error ? (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8" data-testid="invoices-error-state">
          <p className="text-sm text-red-200">We couldn&apos;t load invoices right now.</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/70 p-8" data-testid="invoices-empty-state">
          <h2 className="text-xl font-medium text-white">No invoices yet</h2>
          <p className="mt-3 text-sm text-neutral-400">Create your first invoice and keep payment status visible here.</p>
        </div>
      ) : (
        <ul className="space-y-3" data-testid="invoices-list">
          {invoices.map((invoice: any) => (
            <li key={invoice.id} className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5" data-testid={`invoice-card-${invoice.id}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-medium text-white" data-testid={`invoice-title-${invoice.id}`}>{invoice.reference || invoice.invoice_number || 'Invoice'}</h2>
                  <p className="text-sm text-neutral-400" data-testid={`invoice-status-${invoice.id}`}>{invoice.status || 'Draft'}</p>
                </div>
                <p className="text-lg font-semibold text-white" data-testid={`invoice-total-${invoice.id}`}>£{invoice.total || 0}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
