import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getClientByIdAction } from '@/lib/actions/clients'
import Link from 'next/link'

type Props = {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params

  // Check authentication
  let supabase
  try {
    supabase = await createClient()
  } catch {
    redirect(`/login?next=/clients/${id}`)
  }

  if (!supabase) {
    redirect(`/login?next=/clients/${id}`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect(`/login?next=/clients/${id}`)
  }

  // Fetch profile for onboarding check and org_id validation
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('org_id, onboarding_completed')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-lg mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4" data-testid="client-error">
            <p className="text-red-700">Profile not found</p>
          </div>
          <div className="mt-6">
            <Link href="/clients" className="text-gray-600 hover:text-gray-900">
              ← Back to Clients
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // Enforce onboarding
  if (!profile.onboarding_completed) {
    redirect('/onboarding')
  }

  // Validate org_id
  if (!profile.org_id) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-lg mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4" data-testid="client-error">
            <p className="text-red-700">Organisation not assigned</p>
          </div>
          <div className="mt-6">
            <Link href="/clients" className="text-gray-600 hover:text-gray-900">
              ← Back to Clients
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // Fetch client
  const result = await getClientByIdAction(id)

  if (!result.success || !result.data) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-lg mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4" data-testid="client-error">
            <p className="text-red-700">{result.error || 'Client not found'}</p>
          </div>
          <div className="mt-6">
            <Link href="/clients" className="text-gray-600 hover:text-gray-900">
              ← Back to Clients
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const client = result.data

  return (
    <main className="min-h-screen bg-gray-50 p-6" data-testid="client-detail-page">
      <div className="max-w-lg mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="client-name">
            {client.name}
          </h1>
        </header>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Details</h2>
          
          <dl className="space-y-4">
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <dt className="text-gray-600">Name</dt>
              <dd className="text-gray-900 font-medium" data-testid="client-detail-name">
                {client.name}
              </dd>
            </div>

            <div className="flex justify-between border-b border-gray-100 pb-3">
              <dt className="text-gray-600">Email</dt>
              <dd className="text-gray-900" data-testid="client-detail-email">
                {client.email || '—'}
              </dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-gray-600">Phone</dt>
              <dd className="text-gray-900" data-testid="client-detail-phone">
                {client.phone || '—'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-6">
          <Link href="/clients" className="text-gray-600 hover:text-gray-900">
            ← Back to Clients
          </Link>
        </div>
      </div>
    </main>
  )
}
