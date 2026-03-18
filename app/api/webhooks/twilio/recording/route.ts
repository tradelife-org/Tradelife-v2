import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const formData = await req.formData()
  const recordingUrl = formData.get('RecordingUrl')
  const callSid = formData.get('CallSid')

  await supabase.from('twilio_recordings').insert({
    call_sid: callSid,
    recording_url: recordingUrl,
  })

  return Response.json({ success: true })
}
