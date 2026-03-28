import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CreateClientForm from './CreateClientForm'
import Link from 'next/link'

export default async function CreateClientPage() {
  // Check authentication
  let supabase
  try {
    supabase = await createClient()
  } catch {
    redirect('/login?next=/clients/create')
  }

  if (!supabase) {
    redirect('/login?next=/clients/create')
  }

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login?next=/clients/create')
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6" data-testid="create-client-page">
      <div className="max-w-lg mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add Client</h1>
        </header>

        <div className="bg-white rounded-lg shadow p-6">
          <CreateClientForm />
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
