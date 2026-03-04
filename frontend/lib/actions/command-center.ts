'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cache } from 'react'

// --- Types ---
interface DailyBrief {
  burn_rate: number
  recognized_revenue: number
  schedule_items: { id: string; title: string; date: string }[]
}

interface WidgetsData {
  attention_needed: { id: string; title: string; issue?: string }[]
  active_projects: { id: string; title: string; client?: string }[]
  live_projects: { id: string; title: string; progress?: number }[]
  tte_schedule: { id: string; title: string; date: string }[]
  urgent_tasks: { id: string; title: string; issue?: string }[]
  financial_overview: { revenue: number; expenses: number; retention: number }
}

// --- Jarvis Hub Actions ---
export const getDailyBriefAction = cache(async (): Promise<DailyBrief> => {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get Org ID
  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile?.org_id) throw new Error('Profile/Org missing')
  const orgId = profile.org_id

  // 1. Burn Rate (From burn_rate_snapshots)
  // Assumed schema: id, org_id, burn_rate (int), created_at
  let burnRate = 0
  try {
    const { data: burnSnap, error } = await supabase
      .from('burn_rate_snapshots')
      .select('burn_rate')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (!error && burnSnap) {
      burnRate = burnSnap.burn_rate
    }
  } catch (e) {
    console.warn('burn_rate_snapshots query failed:', e)
  }

  // 2. Recognized Revenue (From quote_snapshots)
  // Sum of net amount from snapshots in last 30 days
  let recognizedRevenue = 0
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: quoteSnaps, error } = await supabase
      .from('quote_snapshots')
      .select('snapshot_data')
      .eq('org_id', orgId)
      .gte('created_at', thirtyDaysAgo)
    
    if (!error && quoteSnaps) {
      recognizedRevenue = quoteSnaps.reduce((sum, snap: any) => {
        // Access nested JSON data
        const amount = snap.snapshot_data?.quote?.quote_amount_net || 0
        return sum + Number(amount)
      }, 0)
    }
  } catch (e) {
     console.warn('quote_snapshots query failed:', e)
  }

  // 3. Next 3 Schedule Items
  // From Jobs table where target_start_date >= now
  const now = new Date().toISOString()
  const { data: schedule } = await supabase
    .from('jobs')
    .select('id, title, target_start_date')
    .eq('org_id', orgId)
    .gte('target_start_date', now)
    .order('target_start_date', { ascending: true })
    .limit(3)

  return {
    burn_rate: burnRate,
    recognized_revenue: recognizedRevenue,
    schedule_items: schedule?.map(j => ({
      id: j.id,
      title: j.title,
      date: j.target_start_date
    })) || []
  }
})

// --- Widgets Data ---
export const getWidgetsData = cache(async (): Promise<WidgetsData> => {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile?.org_id) throw new Error('Profile/Org missing')
  const orgId = profile.org_id

  // 1. Financial Overview (From job_wallet_ledger)
  // Categories: RECOGNIZED_REVENUE, EXPENSE, RETENTION_HELD
  const { data: ledger } = await supabase
    .from('job_wallet_ledger')
    .select('amount, category')
    .eq('org_id', orgId)
  
  let revenue = 0
  let expenses = 0
  let retention = 0
  
  ledger?.forEach((entry: any) => {
    const amt = Number(entry.amount) || 0
    if (entry.category === 'RECOGNIZED_REVENUE') revenue += amt
    if (entry.category === 'EXPENSE') expenses += amt
    if (entry.category === 'RETENTION_HELD') retention += amt
  })

  // 2. Active Projects (From jobs table)
  // Status: ON_SITE, BOOKED
  const { data: activeJobs } = await supabase
    .from('jobs')
    .select('id, title, client:clients(name)') 
    .eq('org_id', orgId)
    .in('status', ['ON_SITE', 'BOOKED'])
    .order('updated_at', { ascending: false })
    .limit(5)

  // 3. Attention Needed
  // Logic: Status = SNAGGING
  const { data: attentionJobs } = await supabase
    .from('jobs')
    .select('id, title, status')
    .eq('org_id', orgId)
    .eq('status', 'SNAGGING')
    .limit(5)

  // 4. Live Projects (ON_SITE only)
  const { data: liveJobs } = await supabase
    .from('jobs')
    .select('id, title')
    .eq('org_id', orgId)
    .eq('status', 'ON_SITE')
    .limit(3)

  // 5. TTE Schedule (Next 5 jobs starting)
  const now = new Date().toISOString()
  const { data: tteSchedule } = await supabase
    .from('jobs')
    .select('id, title, target_start_date')
    .eq('org_id', orgId)
    .gte('target_start_date', now)
    .order('target_start_date', { ascending: true })
    .limit(5)

  // 6. Urgent Tasks
  // Placeholder logic return empty
  
  return {
    attention_needed: attentionJobs?.map(j => ({
      id: j.id,
      title: j.title,
      issue: 'Snagging List Open'
    })) || [],
    active_projects: activeJobs?.map(j => ({
      id: j.id,
      title: j.title,
      // @ts-ignore
      client: j.client?.name || 'Unknown Client' 
    })) || [],
    live_projects: liveJobs?.map(j => ({
      id: j.id,
      title: j.title,
      progress: 50 // Mock progress
    })) || [],
    tte_schedule: tteSchedule?.map(j => ({
      id: j.id,
      title: j.title,
      date: j.target_start_date
    })) || [],
    urgent_tasks: [],
    financial_overview: {
      revenue,
      expenses,
      retention
    }
  }
})
