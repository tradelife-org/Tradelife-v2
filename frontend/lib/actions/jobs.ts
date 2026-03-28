'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type Job = {
  id: string
  title: string
  client_id: string
  org_id: string
  source_quote_id: string
  created_at: string
  client?: {
    id: string
    name: string
  }
  source_quote?: {
    id: string
    title: string
  }
}

export type JobResult = {
  success: boolean
  error?: string
  data?: Job
}

export type JobsResult = {
  success: boolean
  error?: string
  data?: Job[]
}

// Helper to get org_id from current user's profile
async function getOrgId(): Promise<{ orgId: string | null; error?: string }> {
  let supabase
  try {
    supabase = await createClient()
  } catch {
    return { orgId: null, error: 'Failed to initialize service' }
  }

  if (!supabase) {
    return { orgId: null, error: 'Service unavailable' }
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { orgId: null, error: 'Not authenticated' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { orgId: null, error: 'Profile not found' }
  }

  if (!profile.org_id) {
    return { orgId: null, error: 'Organisation not assigned' }
  }

  return { orgId: profile.org_id }
}

// Jobs can ONLY be created from quotes - no manual creation
export async function createJobFromQuoteAction(quoteId: string): Promise<JobResult> {
  // Validate quote ID
  if (!quoteId || typeof quoteId !== 'string' || quoteId.trim() === '') {
    return { success: false, error: 'Quote ID is required' }
  }

  const { orgId, error: orgError } = await getOrgId()
  
  if (orgError || !orgId) {
    return { success: false, error: orgError || 'Organisation not found' }
  }

  let supabase
  try {
    supabase = await createClient()
  } catch {
    return { success: false, error: 'Failed to initialize service' }
  }

  if (!supabase) {
    return { success: false, error: 'Service unavailable' }
  }

  // Fetch quote and verify org ownership
  let quote
  try {
    const { data, error: quoteError } = await supabase
      .from('quotes')
      .select('id, title, client_id, org_id')
      .eq('id', quoteId)
      .eq('org_id', orgId)
      .single()

    if (quoteError || !data) {
      return { success: false, error: 'Quote not found' }
    }
    quote = data
  } catch {
    return { success: false, error: 'Failed to fetch quote' }
  }

  // Check for existing job from this quote
  try {
    const { data: existingJob } = await supabase
      .from('jobs')
      .select('id')
      .eq('source_quote_id', quoteId)
      .eq('org_id', orgId)
      .single()

    if (existingJob) {
      return { success: false, error: 'Job already exists for this quote' }
    }
  } catch {
    // No existing job found - continue with creation
  }

  // Create job from quote
  try {
    const { data, error: insertError } = await supabase
      .from('jobs')
      .insert({
        title: quote.title,
        client_id: quote.client_id,
        org_id: orgId,
        source_quote_id: quote.id
      })
      .select()
      .single()

    if (insertError) {
      return { success: false, error: `Failed to create job: ${insertError.message}` }
    }

    redirect('/jobs')
  } catch (e) {
    // Check if it's a redirect (Next.js throws for redirects)
    if (e && typeof e === 'object' && 'digest' in e) {
      throw e
    }
    return { success: false, error: 'Failed to create job' }
  }
}

export async function getJobsAction(): Promise<JobsResult> {
  const { orgId, error: orgError } = await getOrgId()
  
  if (orgError || !orgId) {
    return { success: false, error: orgError || 'Organisation not found' }
  }

  let supabase
  try {
    supabase = await createClient()
  } catch {
    return { success: false, error: 'Failed to initialize service' }
  }

  if (!supabase) {
    return { success: false, error: 'Service unavailable' }
  }

  try {
    const { data, error: fetchError } = await supabase
      .from('jobs')
      .select(`
        id,
        title,
        client_id,
        org_id,
        source_quote_id,
        created_at,
        client:clients(id, name),
        source_quote:quotes(id, title)
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      return { success: false, error: `Failed to fetch jobs: ${fetchError.message}` }
    }

    // Transform data to flatten relations
    const jobs = (data || []).map((job: Record<string, unknown>) => ({
      ...job,
      client: Array.isArray(job.client) ? job.client[0] : job.client,
      source_quote: Array.isArray(job.source_quote) ? job.source_quote[0] : job.source_quote
    })) as Job[]

    return { success: true, data: jobs }
  } catch {
    return { success: false, error: 'Failed to fetch jobs' }
  }
}

export async function getJobByIdAction(jobId: string): Promise<JobResult> {
  if (!jobId || typeof jobId !== 'string') {
    return { success: false, error: 'Invalid job ID' }
  }

  const { orgId, error: orgError } = await getOrgId()
  
  if (orgError || !orgId) {
    return { success: false, error: orgError || 'Organisation not found' }
  }

  let supabase
  try {
    supabase = await createClient()
  } catch {
    return { success: false, error: 'Failed to initialize service' }
  }

  if (!supabase) {
    return { success: false, error: 'Service unavailable' }
  }

  try {
    const { data, error: fetchError } = await supabase
      .from('jobs')
      .select(`
        id,
        title,
        client_id,
        org_id,
        source_quote_id,
        created_at,
        client:clients(id, name),
        source_quote:quotes(id, title)
      `)
      .eq('id', jobId)
      .eq('org_id', orgId)
      .single()

    if (fetchError) {
      return { success: false, error: 'Job not found' }
    }

    if (!data) {
      return { success: false, error: 'Job not found' }
    }

    // Flatten relations
    const job = {
      ...data,
      client: Array.isArray(data.client) ? data.client[0] : data.client,
      source_quote: Array.isArray(data.source_quote) ? data.source_quote[0] : data.source_quote
    } as Job

    return { success: true, data: job }
  } catch {
    return { success: false, error: 'Failed to fetch job' }
  }
}
