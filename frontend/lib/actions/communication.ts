'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateFlashJSON } from '@/lib/ai/gemini'

// ============================================================================
// CHAT ACTIONS
// ============================================================================

export async function sendJobMessageAction(jobId: string, content: string, senderType: 'ORG' | 'CLIENT' = 'ORG') {
  const supabase = createServerSupabaseClient()
  
  // Use Admin Client if needed (e.g. public portal user)
  // Assuming this action is called by Authenticated Org User for 'ORG'
  // and public token user for 'CLIENT'.
  // If 'CLIENT', we need to verify token context.
  // For simplicity, we assume this action is used by ORG users inside /jobs/[id]
  // and Portal users use `sendPortalMessage` which we will update to write to `communication_logs` too?
  // Actually, Phase 15 says "Implement real-time chat in Wilson Portal using communication_logs".
  // So we should unify `portal_messages` and `communication_logs` or migrate?
  // `portal_messages` was created in Phase 3.
  // Phase 15 introduces `communication_logs` tied to `job_id`.
  // `portal_messages` were tied to `conversation_id` (Client-level).
  // Let's create a new unified action or update existing.
  
  // Let's implement `sendJobMessageAction` for the Portal to use when viewing a specific Job.
  // We need to pass the Token to verify access to that Job.
  
  // Wait, the prompt says "Implement real-time chat... using communication_logs".
  // Let's modify `sendPortalMessage` in `lib/actions/portal.ts` to ALSO write to `communication_logs` if a job context is active?
  // Or just use `communication_logs` for job-specific chat.
  
  // Let's stick to the prompt: "Implement... using communication_logs".
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Org User Flow
  if (user && senderType === 'ORG') {
    const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
    if (!profile) throw new Error('Unauthorized')
    
    await supabase.from('communication_logs').insert({
      org_id: profile.org_id,
      job_id: jobId,
      sender_type: 'ORG',
      sender_id: user.id,
      content
    })
    
    revalidatePath(`/jobs/${jobId}`)
    return { success: true }
  }
  
  // If Client, we need validation. Usually handled by `lib/actions/portal.ts`.
  throw new Error('Use portal actions for client messages')
}

// ============================================================================
// AI MEDIATOR
// ============================================================================

export async function mediatorAction(jobId: string) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) throw new Error('Unauthorized')

  // 1. Fetch Context
  // Chat Logs
  const { data: logs } = await supabase
    .from('communication_logs')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: true })

  // Quote Snapshot (Agreed Scope)
  const { data: job } = await supabase
    .from('jobs')
    .select('*, quotes(accepted_snapshot_id, quote_snapshots(snapshot_data))')
    .eq('id', jobId)
    .single()

  const snapshot = job?.quotes?.quote_snapshots?.snapshot_data
  const scope = snapshot?.quote_sections?.map((s: any) => 
    s.quote_line_items?.map((l: any) => l.description).join('; ')
  ).join('\n')

  // 2. Ask Gemini 1.5 Pro
  const prompt = `You are an AI Mediator. Resolve a dispute based on facts.
  
  AGREED SCOPE:
  ${scope}
  
  COMMUNICATION LOG:
  ${logs?.map((l: any) => `${l.sender_type}: ${l.content}`).join('\n')}
  
  Task: Identify the conflict. Compare against Agreed Scope. Provide a neutral, data-backed resolution.
  Return JSON: { analysis: string, resolution: string, confidence: number }`

  const result = await generateFlashJSON(prompt) // Using Flash for speed, Pro if complex logic needed
  
  // 3. Log Resolution
  await supabase.from('communication_logs').insert({
    org_id: profile.org_id,
    job_id: jobId,
    sender_type: 'AI',
    content: `[AI MEDIATOR] ${result.resolution}`
  })

  revalidatePath(`/jobs/${jobId}`)
  return result
}
