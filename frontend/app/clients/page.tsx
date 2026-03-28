import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getClientsAction } from '@/lib/actions/clients'
import Link from 'next/link'

export default async function ClientsPage() {
  // Check authentication
  let supabase
  try {
    supabase = await createClient()
  } catch {
    redirect('/login?next=/clients')
  }

  if (!supabase) {
    redirect('/login?next=/clients')
  }

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login?next=/clients')
  }

  // Fetch clients
  const result = await getClientsAction()

  if (!result.success) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4" data-testid="clients-error">
            <p className="text-red-700">{result.error}</p>
          </div>
        </div>
      </main>
    )
  }

  const clients = result.data || []

  return (
    <main className="min-h-screen bg-gray-50 p-6" data-testid="clients-page">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <Link
            href="/clients/create"
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
            data-testid="create-client-link"
          >
            Add Client
          </Link>
        </header>

        {clients.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center" data-testid="clients-empty">
            <p className="text-gray-500 mb-4">No clients yet</p>
            <Link
              href="/clients/create"
              className="text-blue-600 hover:underline"
            >
              Create your first client
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden" data-testid="clients-list">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client.id} data-testid={`client-row-${client.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-900 font-medium">{client.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-600">{client.email || '—'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-600">{client.phone || '—'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        href={`/clients/${client.id}`}
                        className="text-blue-600 hover:underline"
                        data-testid={`view-client-${client.id}`}
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
