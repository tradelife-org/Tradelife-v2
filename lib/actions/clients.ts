'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'

const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export type ClientInput = z.infer<typeof clientSchema>

export async function createClient(data: ClientInput) {
  const supabase = createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get user's org_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  const { error } = await supabase.from('clients').insert({
    org_id: profile.org_id,
    name: data.name,
    email: data.email || null,
    phone: data.phone || null,
    address: data.address || null,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/clients')
  redirect('/clients')
}

export async function updateClient(id: string, data: ClientInput) {
  const supabase = createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Org ID check is handled by RLS, but we need to ensure the user is in the org context
  // implicitly handled by createServerSupabaseClient + RLS policies

  const { error } = await supabase
    .from('clients')
    .update({
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)
  redirect('/clients')
}

export async function deleteClient(id: string) {
    const supabase = createServerSupabaseClient()
    
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
  
    if (error) throw new Error(error.message)
  
    revalidatePath('/clients')
}
