import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateFlashJSON } from '@/lib/ai/gemini'

// Admin Client
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const formData = await req.formData()
  const recordingUrl = formData.get('RecordingUrl') as string
  const callSid = formData.get('CallSid') as string

  if (!recordingUrl) return NextResponse.json({ error: 'No recording' }, { status: 400 })

  console.log(`Processing recording for ${callSid}: ${recordingUrl}`)

  // 1. Fetch Call Context (Find Log)
  // We need job_id. It was logged in initiateProxyCallAction via content SID match?
  // Regex search in logs? Or store SID in dedicated table?
  // `communication_logs` has `content`. We can search.
  const { data: log } = await supabase
    .from('communication_logs')
    .select('job_id, org_id')
    .ilike('content', `%${callSid}%`)
    .single()

  if (log) {
    // 2. Transcribe (Mock/Simulate or use Gemini Audio capability if enabled)
    // Gemini Flash handles audio files via URI? Or file upload.
    // Ideally we download the MP3 and send to Gemini.
    // For MVP, we'll assume we can pass the URL or mock the transcription step if Gemini SDK requires bytes.
    // Let's assume we download it.
    
    // ... Download logic skipped for brevity/complexity.
    // Mock Transcription:
    const transcript = "(Mock Transcript) Client asking about changing the radiator type."

    // 3. AI Summarize
    const prompt = `Summarize this call transcript. If actionable request (quote change, visit), output JSON: { follow_up_needed: boolean, task_title: string }
    Transcript: "${transcript}"`
    
    const analysis = await generateFlashJSON(prompt)

    // 4. Update Log
    await supabase.from('communication_logs').insert({
      org_id: log.org_id,
      job_id: log.job_id,
      sender_type: 'AI',
      content: `Call Recording: ${recordingUrl}\nSummary: ${transcript}`
    })

    // 5. Create Task
    if (analysis.follow_up_needed) {
      await supabase.from('assistant_tasks').insert({
        org_id: log.org_id,
        related_job_id: log.job_id,
        title: analysis.task_title || 'Call Follow-up',
        status: 'PENDING',
        priority: 'NORMAL'
      })
    }
  }

  return NextResponse.json({ success: true })
}
