import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getClientsAction } from '@/lib/actions/clients'
import CreateQuoteForm from './CreateQuoteForm'
import Link from 'next/link'

export default async function CreateQuotePage() {
  // Check authentication
  let supabase
  try {
    supabase = await createClient()
  } catch {
    redirect('/login?next=/quotes/create')
  }

  if (!supabase) {
    redirect('/login?next=/quotes/create')
  }

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login?next=/quotes/create')
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4" data-testid="create-quote-error">
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
        <div className="max-w-lg mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4" data-testid="create-quote-error">
            <p className="text-red-700">Organisation not assigned</p>
          </div>
        </div>
      </main>
    )
  }

  // Fetch clients for dropdown
  const clientsResult = await getClientsAction()
  const clients = clientsResult.success ? (clientsResult.data || []) : []

  return (
    <main className="min-h-screen bg-gray-50 p-6" data-testid="create-quote-page">
      <div className="max-w-lg mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">New Quote</h1>
        </header>

        <div className="bg-white rounded-lg shadow p-6">
          {clients.length === 0 ? (
            <div className="text-center py-4" data-testid="no-clients-warning">
              <p className="text-gray-600 mb-4">You need at least one client to create a quote.</p>
              <Link
                href="/clients/create"
                className="text-blue-600 hover:underline"
              >
                Create a client first
              </Link>
            </div>
          ) : (
            <CreateQuoteForm clients={clients} />
          )}
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
