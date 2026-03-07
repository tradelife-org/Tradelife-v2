import { createServerSupabaseClient } from '@/lib/supabase/server'
import { GlassPanel } from '@/components/ui/glass-panel'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function ClientsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: clients } = await supabase.from('clients').select('*').order('name')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-heading font-bold text-slate-900">Clients</h1>
        <Link href="/clients/create" className="btn btn-primary bg-safety hover:bg-safety-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-lg">
          <Plus className="w-5 h-5" />
          New Client
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients?.map((client) => (
          <GlassPanel key={client.id} className="p-6 hover:scale-[1.02] transition-transform duration-200 border-white/40 bg-white/60">
            <Link href={`/clients/${client.id}`} className="block h-full">
              <h3 className="text-xl font-bold mb-2 text-slate-800 font-heading">{client.name}</h3>
              <div className="space-y-2 text-slate-600 text-sm font-body">
                {client.email && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold w-16 text-slate-500">Email:</span>
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold w-16 text-slate-500">Phone:</span>
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold w-16 text-slate-500">Address:</span>
                    <span className="truncate">{client.address}</span>
                  </div>
                )}
              </div>
            </Link>
          </GlassPanel>
        ))}
        {clients?.length === 0 && (
          <div className="col-span-full text-center py-12">
            <GlassPanel className="p-8 inline-block">
               <p className="text-slate-500 text-lg">No clients found. Create your first client to get started.</p>
            </GlassPanel>
          </div>
        )}
      </div>
    </div>
  )
}
