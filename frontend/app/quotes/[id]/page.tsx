import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getQuoteByIdAction } from '@/lib/actions/quotes'
import Link from 'next/link'

type Props = {
  params: Promise<{ id: string }>
}

export default async function QuoteDetailPage({ params }: Props) {
  const { id } = await params

  // Check authentication
  let supabase
  try {
    supabase = await createClient()
  } catch {
    redirect(`/login?next=/quotes/${id}`)
  }

  if (!supabase) {
    redirect(`/login?next=/quotes/${id}`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect(`/login?next=/quotes/${id}`)
  }

  // Fetch profile for guards
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('org_id, onboarding_completed')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-lg mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4" data-testid="quote-error">
            <p className="text-red-700">Profile not found</p>
          </div>
          <div className="mt-6">
            <Link href="/quotes" className="text-gray-600 hover:text-gray-900">
              ← Back to Quotes
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (!profile.onboarding_completed) {
    redirect('/onboarding')
  }

  if (!profile.org_id) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-lg mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4" data-testid="quote-error">
            <p className="text-red-700">Organisation not assigned</p>
          </div>
          <div className="mt-6">
            <Link href="/quotes" className="text-gray-600 hover:text-gray-900">
              ← Back to Quotes
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // Fetch quote
  const result = await getQuoteByIdAction(id)

  if (!result.success || !result.data) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-lg mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4" data-testid="quote-error">
            <p className="text-red-700">{result.error || 'Quote not found'}</p>
          </div>
          <div className="mt-6">
            <Link href="/quotes" className="text-gray-600 hover:text-gray-900">
              ← Back to Quotes
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const quote = result.data

  return (
    <main className="min-h-screen bg-gray-50 p-6" data-testid="quote-detail-page">
      <div className="max-w-lg mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="quote-title">
            {quote.title}
          </h1>
        </header>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quote Details</h2>
          
          <dl className="space-y-4">
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <dt className="text-gray-600">Title</dt>
              <dd className="text-gray-900 font-medium" data-testid="quote-detail-title">
                {quote.title}
              </dd>
            </div>

            <div className="flex justify-between border-b border-gray-100 pb-3">
              <dt className="text-gray-600">Client</dt>
              <dd className="text-gray-900" data-testid="quote-detail-client">
                {quote.client?.name || '—'}
              </dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-gray-600">Created</dt>
              <dd className="text-gray-900" data-testid="quote-detail-created">
                {new Date(quote.created_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-6">
          <Link href="/quotes" className="text-gray-600 hover:text-gray-900">
            ← Back to Quotes
          </Link>
        </div>
      </div>
    </main>
  )
}
