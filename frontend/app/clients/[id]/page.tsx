import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ClientForm } from '@/components/clients/client-form'
import PortalLinkGenerator from '@/components/clients/portal-link-generator'
import { notFound } from 'next/navigation'

export default async function EditClientPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: client } = await supabase.from('clients').select('*').eq('id', params.id).single()

  if (!client) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-slate-900">{client.name}</h1>
        <p className="text-slate-500">Manage client details and portal access</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <ClientForm client={client} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <PortalLinkGenerator clientId={client.id} />
          
          {/* Future: Activity Feed or Stats */}
        </div>
      </div>
    </div>
  )
}
