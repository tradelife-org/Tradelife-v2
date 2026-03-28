import Link from 'next/link'
import { getSupabaseServerClient } from '@/lib/supabase/server-safe'

export default async function ClientsPage() {
  const hasSupabaseEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  if (!hasSupabaseEnv) {
    return <ClientsState clients={[]} />
  }

  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase.from('clients').select('*')

  if (error) {
    return <ClientsState clients={[]} error />
  }

  return <ClientsState clients={data ?? []} />
}

function ClientsState({ clients, error = false }: { clients: any[]; error?: boolean }) {
  return (
    <section className="mx-auto max-w-4xl space-y-6" data-testid="clients-page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-neutral-500" data-testid="clients-page-kicker">CRM</p>
          <h1 className="text-3xl font-semibold text-white" data-testid="clients-page-title">Clients</h1>
          <p className="text-sm text-neutral-400" data-testid="clients-page-description">View your customer list without raw debug output or placeholder blocks.</p>
        </div>

        <Link href="/clients/create" className="inline-flex items-center justify-center rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700" data-testid="create-client-button">
          Create Client
        </Link>
      </div>

      {error ? (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8" data-testid="clients-error-state">
          <p className="text-sm text-red-200">We couldn&apos;t load clients right now.</p>
        </div>
      ) : clients.length === 0 ? (
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/70 p-8" data-testid="clients-empty-state">
          <h2 className="text-xl font-medium text-white">No clients yet</h2>
          <p className="mt-3 text-sm text-neutral-400">Add a customer to start linking quotes, jobs, and invoices together.</p>
        </div>
      ) : (
        <ul className="space-y-3" data-testid="clients-list">
          {clients.map((client: any) => (
            <li key={client.id} className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5" data-testid={`client-card-${client.id}`}>
              <h2 className="text-lg font-medium text-white" data-testid={`client-name-${client.id}`}>{client.name || client.business_name || 'Client'}</h2>
              <p className="mt-2 text-sm text-neutral-400" data-testid={`client-email-${client.id}`}>{client.email || client.phone || 'No contact details added yet'}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
