import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value ?? 0)
}

function QuotesHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.28em] text-neutral-500" data-testid="quotes-page-kicker">Sales</p>
        <h1 className="text-3xl font-semibold text-white" data-testid="quotes-page-title">Quotes</h1>
        <p className="text-sm text-neutral-400" data-testid="quotes-page-description">Keep estimates tidy, visible, and ready to turn into booked work.</p>
      </div>

      <Link
        href="/quotes/create"
        className="inline-flex items-center justify-center rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        data-testid="create-quote-button"
      >
        Create Quote
      </Link>
    </div>
  )
}

export default async function QuotesPage() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('quotes')
    .select(`
      id,
      status,
      reference,
      quote_amount_net,
      clients ( name ),
      quote_sections ( title, sort_order )
    `)
    .order('created_at', { ascending: false })
  const quotes = data ?? []

  if (error) {
    return (
      <section className="mx-auto max-w-4xl space-y-6" data-testid="quotes-page">
        <QuotesHeader />
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6" data-testid="quotes-error-state">
          <h2 className="text-lg font-medium text-white">Quotes</h2>
          <p className="mt-2 text-sm text-red-200">We couldn&apos;t load quotes right now.</p>
        </div>
      </section>
    )
  }

  if (quotes.length === 0) {
    return (
      <section className="mx-auto max-w-4xl space-y-6" data-testid="quotes-page">
        <QuotesHeader />
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/70 p-8 shadow-[0_24px_80px_-48px_rgba(37,99,235,0.5)]" data-testid="quotes-empty-state">
          <div className="max-w-xl space-y-3">
            <h2 className="text-xl font-medium text-white" data-testid="quotes-empty-title">No quotes yet</h2>
            <p className="text-sm text-neutral-400" data-testid="quotes-empty-description">
              Start a new quote to track pricing, scope, and customer approvals in one place.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-4xl space-y-6" data-testid="quotes-page">
      <QuotesHeader />
      <ul className="space-y-3" data-testid="quotes-list">
        {quotes.map((quote: any) => {
          const firstSection = [...(quote.quote_sections || [])].sort((a, b) => a.sort_order - b.sort_order)[0]
          const clientName = quote.clients?.name || 'Client not assigned'
          const jobTitle = firstSection?.title || quote.reference || 'Untitled quote'

          return (
            <li key={quote.id} data-testid={`quote-card-${quote.id}`}>
              <Link href={`/quotes/${quote.id}`} className="block rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5 transition-colors hover:border-neutral-700" data-testid={`quote-link-${quote.id}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-medium text-white" data-testid={`quote-job-title-${quote.id}`}>
                        {jobTitle}
                      </h2>
                      <span className="rounded-full border border-neutral-700 bg-neutral-800 px-2.5 py-1 text-xs text-neutral-300" data-testid={`quote-status-${quote.id}`}>
                        {quote.status || 'DRAFT'}
                      </span>
                    </div>

                    <p className="text-sm text-neutral-400" data-testid={`quote-client-${quote.id}`}>
                      {clientName}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">Total</p>
                    <p className="mt-1 text-xl font-semibold text-white" data-testid={`quote-total-${quote.id}`}>
                      {formatCurrency(quote.quote_amount_net)}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
