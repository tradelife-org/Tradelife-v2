import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateFlashJSON } from '@/lib/ai/gemini'
import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'dummy' })

// Admin Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
)

export async function POST(req: Request) {
  const formData = await req.formData()
  const recordingUrl = formData.get('RecordingUrl') as string
  const callSid = formData.get('CallSid') as string

  if (!recordingUrl) return NextResponse.json({ error: 'No recording' }, { status: 400 })

  console.log(`Processing recording for ${callSid}: ${recordingUrl}`)

  // 1. Fetch Call Context (Find Log)
  const { data: log } = await supabase
    .from('communication_logs')
    .select('job_id, org_id')
    .ilike('content', `%${callSid}%`)
    .single()

  if (log) {
    // 2. Transcribe using OpenAI Whisper
    let transcript = ""
    try {
      const audioRes = await fetch(recordingUrl)
      if (!audioRes.ok) throw new Error(`Failed to fetch audio: ${audioRes.statusText}`)

      const transcription = await openai.audio.transcriptions.create({
        file: audioRes,
        model: "whisper-1"
      })
      transcript = transcription.text
    } catch (err) {
      console.error("Transcription error:", err)
      transcript = "(Transcription failed)"
    }

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
