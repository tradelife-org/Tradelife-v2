import { getPublicQuote } from '@/lib/actions/public-quote'
import { PublicQuoteClient } from './client'

interface PageProps {
  params: { share_token: string }
}

export default async function PublicQuotePage({ params }: PageProps) {
  const quote = await getPublicQuote(params.share_token)

  if (!quote) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100">
            <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-heading font-bold text-slate-900" data-testid="quote-not-found">
            Quote not found
          </h1>
          <p className="text-slate-500">This link may have expired or is invalid.</p>
        </div>
      </main>
    )
  }

  return <PublicQuoteClient quote={quote} shareToken={params.share_token} />
}
