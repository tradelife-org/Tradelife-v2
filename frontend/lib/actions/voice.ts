'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { twilioClient, TWILIO_PHONE_NUMBER } from '@/lib/twilio'
import { generateFlashJSON } from '@/lib/ai/gemini'
import { revalidatePath } from 'next/cache'

// ============================================================================
// PHASE 18: TWILIO MISSION CONTROL
// ============================================================================

// Task 1: Click-to-Call
export async function initiateProxyCallAction(jobId: string) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Fetch Numbers
  const { data: profile } = await supabase.from('profiles').select('phone, org_id').eq('id', user.id).single()
  const { data: job } = await supabase.from('jobs').select('title, clients(phone, name)').eq('id', jobId).single()

  // Typescript thinks clients is array due to Supabase join syntax, but we used single().
  // However, select('clients(...)') might return array or object depending on schema relationship (1:1 or 1:N).
  // Schema: jobs.client_id -> clients.id (N:1). So job has ONE client.
  // Supabase JS types sometimes infer array.
  // We'll cast safely.
  const client: any = job?.clients
  // If array, take first.
  const clientData = Array.isArray(client) ? client[0] : client

  if (!profile?.phone || !clientData?.phone) throw new Error('Phone numbers missing')

  // Create Call
  const twiml = `
    <Response>
      <Say>Connecting you to ${clientData.name} via TradeLife.</Say>
      <Dial callerId="${TWILIO_PHONE_NUMBER}" record="record-from-answer" recordingStatusCallback="${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/twilio/recording">
        ${clientData.phone}
      </Dial>
    </Response>
  `

  const call = await twilioClient.calls.create({
    twiml,
    to: profile.phone,
    from: TWILIO_PHONE_NUMBER,
    statusCallback: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/twilio/status`,
    statusCallbackEvent: ['completed']
  })

  // Log Call (Initial)
  await supabase.from('communication_logs').insert({
    org_id: profile.org_id,
    job_id: jobId,
    sender_type: 'SYSTEM',
    content: `Voice Call Initiated (SID: ${call.sid})`
  })

  return { success: true, sid: call.sid }
}

// Task 2: Automated SMS ("On My Way")
export async function sendOnMyWaySMS(jobId: string) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: job } = await supabase.from('jobs').select('title, org_id, clients(phone, name)').eq('id', jobId).single()
  
  const client: any = job?.clients
  const clientData = Array.isArray(client) ? client[0] : client

  if (!clientData?.phone) throw new Error('Client phone missing')

  const message = `Hi ${clientData.name}, your tradesperson from TradeLife is en route and will arrive in approx 20 mins.`

  const sms = await twilioClient.messages.create({
    body: message,
    from: TWILIO_PHONE_NUMBER,
    to: clientData.phone
  })

  // Log SMS
  await supabase.from('communication_logs').insert({
    org_id: job!.org_id,
    job_id: jobId,
    sender_type: 'SYSTEM',
    content: `SMS Sent: "${message}"`
  })

  return { success: true, sid: sms.sid }
}

// Task 3: AI Transcription (To be called by Webhook)
export async function processCallRecording(recordingUrl: string, callSid: string) {
  // Placeholder
}
