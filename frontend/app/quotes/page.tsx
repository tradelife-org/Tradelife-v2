import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getQuotesAction } from '@/lib/actions/quotes'
import Link from 'next/link'

export default async function QuotesPage() {
  // Check authentication
  let supabase
  try {
    supabase = await createClient()
  } catch {
    redirect('/login?next=/quotes')
  }

  if (!supabase) {
    redirect('/login?next=/quotes')
  }

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login?next=/quotes')
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
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4" data-testid="quotes-error">
            <p className="text-red-700">Profile not found</p>
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
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4" data-testid="quotes-error">
            <p className="text-red-700">Organisation not assigned</p>
          </div>
        </div>
      </main>
    )
  }

  // Fetch quotes
  const result = await getQuotesAction()

  if (!result.success) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4" data-testid="quotes-error">
            <p className="text-red-700">{result.error}</p>
          </div>
        </div>
      </main>
    )
  }

  const quotes = result.data || []

  return (
    <main className="min-h-screen bg-gray-50 p-6" data-testid="quotes-page">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quotes</h1>
          <Link
            href="/quotes/create"
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
            data-testid="create-quote-link"
          >
            New Quote
          </Link>
        </header>

        {quotes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center" data-testid="quotes-empty">
            <p className="text-gray-500 mb-4">No quotes yet</p>
            <Link
              href="/quotes/create"
              className="text-blue-600 hover:underline"
            >
              Create your first quote
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden" data-testid="quotes-list">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quotes.map((quote) => (
                  <tr key={quote.id} data-testid={`quote-row-${quote.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-900 font-medium">{quote.title}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-600">{quote.client?.name || '—'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-600">
                        {new Date(quote.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        href={`/quotes/${quote.id}`}
                        className="text-blue-600 hover:underline"
                        data-testid={`view-quote-${quote.id}`}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
