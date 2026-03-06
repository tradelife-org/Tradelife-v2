'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getBankBalance } from '@/lib/actions/banking'
import { generateFlashJSON } from '@/lib/ai/gemini'

export async function getMorningBriefData() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('profiles').select('org_id, full_name').eq('id', user.id).single()
  if (!profile) throw new Error('Profile not found')

  const orgId = profile.org_id

  // 1. Bookings (Today/Week)
  const today = new Date()
  const nextWeek = new Date(today)
  nextWeek.setDate(today.getDate() + 7)
  
  const { data: visits } = await supabase
    .from('job_visits')
    .select('id, title, start_time')
    .eq('org_id', orgId)
    .gte('start_time', today.toISOString())
    .lte('start_time', nextWeek.toISOString())
    .order('start_time', { ascending: true })
    .limit(5)

  // 2. Bank Balance
  const balance = await getBankBalance()

  // 3. Unsent Drafts
  const { count: draftCount } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('status', 'DRAFT')

  // 4. Unread Messages
  const { count: unreadCount } = await supabase
    .from('inbox_messages')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('is_read', false)

  return {
    userName: profile.full_name?.split(' ')[0] || 'Boss',
    bookings: visits || [],
    balance,
    draftCount: draftCount || 0,
    unreadCount: unreadCount || 0
  }
}
