import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ClientForm } from '@/components/clients/client-form'
import { notFound } from 'next/navigation'

export default async function EditClientPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: client } = await supabase.from('clients').select('*').eq('id', params.id).single()

  if (!client) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ClientForm client={client} />
    </div>
  )
}
