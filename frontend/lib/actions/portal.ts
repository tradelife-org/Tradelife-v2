'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ============================================================================
// INTERNAL ACTIONS (Authenticated User)
// ============================================================================

export async function generatePortalLink(clientId: string) {
  const supabase = createServerSupabaseClient()
  
  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get org_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  // Create invite
  const { data, error } = await supabase
    .from('portal_invites')
    .insert({
      org_id: profile.org_id,
      client_id: clientId,
      // token is auto-generated
      // expires_at is auto-generated (7 days)
    })
    .select('token, expires_at')
    .single()

  if (error) throw new Error(error.message)

  return {
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/p/${data.token}`,
    expiresAt: data.expires_at
  }
}

// ============================================================================
// PUBLIC ACTIONS (Token Access)
// ============================================================================

/**
 * Validates token and returns Portal Context (Client info, Timeline, etc)
 */
export async function getPortalContext(token: string) {
  const supabase = createServerSupabaseClient()

  // 1. Verify Token & Get Ids
  const { data: invite, error } = await supabase
    .from('portal_invites')
    .select('client_id, org_id, expires_at')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !invite) {
    throw new Error('Invalid or expired portal link')
  }

  // 2. Fetch Client & Org Details
  const { data: client } = await supabase
    .from('clients')
    .select('name, email')
    .eq('id', invite.client_id)
    .single()

  const { data: org } = await supabase
    .from('organisations')
    .select('name')
    .eq('id', invite.org_id)
    .single()

  // 3. Fetch Data via Service Role (Bypass RLS for public token access)
  const { createClient } = await import('@supabase/supabase-js')
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: quotes } = await adminClient
    .from('quotes')
    .select('id, reference, status, quote_amount_gross, created_at')
    .eq('client_id', invite.client_id)
    .order('created_at', { ascending: false })

  const { data: jobs } = await adminClient
    .from('jobs')
    .select('id, title, status, target_start_date, created_at')
    .eq('client_id', invite.client_id)
    .order('created_at', { ascending: false })

  // NEW: Fetch Visible Visits
  const { data: visits } = await adminClient
    .from('job_visits')
    .select('id, title, start_time, end_time, status, visit_type')
    .eq('client_visible', true)
    // We need to join jobs to filter by client_id, but supabase-js join filter is tricky.
    // Instead, we can filter by job_ids we just fetched.
    .in('job_id', jobs?.map((j: any) => j.id) || [])
    .gt('start_time', new Date().toISOString()) // Only upcoming? Prompt says "upcoming visits"
    .order('start_time', { ascending: true })

  // NEW: Fetch Sent Invoices
  const { data: invoices } = await adminClient
    .from('invoices')
    .select('id, invoice_number, amount_gross, status, issue_date, due_date')
    .in('source_job_id', jobs?.map((j: any) => j.id) || [])
    .neq('status', 'DRAFT') // Only show SENT, PAID, OVERDUE
    .order('issue_date', { ascending: false })

  return {
    client,
    org,
    quotes,
    jobs,
    visits,
    invoices,
    valid: true
  }
}

/**
 * Sends a message from the client portal.
 * Handles Out-of-Hours Auto-Response logic.
 */
export async function sendPortalMessage(token: string, content: string) {
  const supabase = createServerSupabaseClient()
  
  // 1. Validate Token & Get Context
  const { data: invite } = await supabase
    .from('portal_invites')
    .select('client_id, org_id')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invite) throw new Error('Invalid token')

  // 2. Use Admin Client to bypass RLS for insertion (since anon user)
  const { createClient } = await import('@supabase/supabase-js')
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 3. Find/Create Conversation
  let conversationId: string
  const { data: existingConv } = await adminClient
    .from('portal_conversations')
    .select('id')
    .eq('client_id', invite.client_id)
    .eq('org_id', invite.org_id)
    .eq('status', 'OPEN')
    .single()

  if (existingConv) {
    conversationId = existingConv.id
  } else {
    const { data: newConv } = await adminClient
      .from('portal_conversations')
      .insert({
        org_id: invite.org_id,
        client_id: invite.client_id,
        title: 'General Enquiry'
      })
      .select('id')
      .single()
    conversationId = newConv!.id
  }

  // 4. Insert User Message
  await adminClient.from('portal_messages').insert({
    conversation_id: conversationId,
    org_id: invite.org_id,
    sender_type: 'CLIENT',
    content: content
  })

  // 5. Check Availability & Auto-Reply
  const { data: availability } = await adminClient
    .from('user_availability')
    .select('*')
    .eq('org_id', invite.org_id)
    .single()

  // Default availability if not set: 09:00 - 17:00 London
  const now = new Date()
  // Simple time check (ignoring sophisticated timezone handling for MVP, assuming London/Server time)
  // Convert current time to HH:MM string
  const currentHour = now.getHours()
  const startHour = availability ? parseInt(availability.start_time.split(':')[0]) : 9
  const endHour = availability ? parseInt(availability.end_time.split(':')[0]) : 17
  
  const isOutOfHours = currentHour < startHour || currentHour >= endHour

  if (isOutOfHours && (!availability || availability.auto_reply_enabled)) {
    // Insert AI Auto-Response
    await adminClient.from('portal_messages').insert({
      conversation_id: conversationId,
      org_id: invite.org_id,
      sender_type: 'AI',
      content: "Thanks for your message. Sam is currently unavailable but will get back to you during working hours (09:00 - 17:00)."
    })
  }

  revalidatePath(`/p/${token}`)
}

export async function fetchPortalMessages(token: string) {
    // We can use the secure RPC we created, OR just admin client query.
    // Let's use admin client query for flexibility.
    
    const supabase = createServerSupabaseClient()
    const { data: invite } = await supabase
      .from('portal_invites')
      .select('client_id')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single()
  
    if (!invite) return []
  
    const { createClient } = await import('@supabase/supabase-js')
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  
    // Fetch conversation
    const { data: conv } = await adminClient
      .from('portal_conversations')
      .select('id')
      .eq('client_id', invite.client_id)
      .eq('status', 'OPEN')
      .single()
      
    if (!conv) return []

    const { data: messages } = await adminClient
      .from('portal_messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true })
      
    return messages || []
}
