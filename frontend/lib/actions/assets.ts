'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generateContent } from '@/lib/ai/gemini'
import { revalidatePath } from 'next/cache'
import { PropertyAsset } from '@/lib/types/database'

export interface AssetOCRData {
  asset_type: string
  manufacturer: string | null
  model: string | null
  serial_number: string | null
  install_date: string | null
  warranty_expiry: string | null
  notes: string | null
}

export async function ocrAssetAction(formData: FormData): Promise<AssetOCRData> {
  const file = formData.get('file') as File
  if (!file) throw new Error('No file provided')

  const arrayBuffer = await file.arrayBuffer()
  const base64Data = Buffer.from(arrayBuffer).toString('base64')
  const mimeType = file.type

  const prompt = `
    Analyze this image of an equipment data plate or warranty document.
    Extract the following details:
    1. Asset Type (e.g., Boiler, Consumer Unit, Heat Pump, AC Unit)
    2. Manufacturer
    3. Model
    4. Serial Number
    5. Install Date (if visible, in ISO YYYY-MM-DD format)
    6. Warranty Expiry Date (if visible or mentioned, in ISO YYYY-MM-DD format)
    7. Any other relevant notes (e.g., fuel type, capacity)

    Return JSON:
    {
      "asset_type": "string",
      "manufacturer": "string | null",
      "model": "string | null",
      "serial_number": "string | null",
      "install_date": "string | null",
      "warranty_expiry": "string | null",
      "notes": "string | null"
    }
  `

  const imagePart = {
    inline_data: {
      mime_type: mimeType,
      data: base64Data
    }
  }

  try {
    const text = await generateContent(prompt, true, [imagePart])
    const data = JSON.parse(text)
    return data as AssetOCRData
  } catch (err) {
    console.error('Asset OCR failed:', err)
    throw new Error('Failed to analyze asset document')
  }
}

export async function saveAssetAction(jobId: string, data: AssetOCRData) {
  const supabase = createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get org_id and client_id from job
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('org_id, client_id')
    .eq('id', jobId)
    .single()

  if (jobError || !job) throw new Error('Job not found')

  // Insert Asset
  const { data: asset, error: assetError } = await supabase
    .from('property_assets')
    .insert({
      org_id: job.org_id,
      client_id: job.client_id,
      job_id: jobId,
      asset_type: data.asset_type,
      manufacturer: data.manufacturer,
      model: data.model,
      serial_number: data.serial_number,
      install_date: data.install_date,
      warranty_expiry: data.warranty_expiry,
      notes: data.notes
    })
    .select()
    .single()

  if (assetError) {
    console.error('Save asset failed:', assetError)
    throw new Error('Failed to save asset')
  }

  // Auto-generate Maintenance Reminders
  const reminders = []

  // 1. Warranty Expiry Reminder
  if (data.warranty_expiry) {
    reminders.push({
      org_id: job.org_id,
      asset_id: asset.id,
      title: `Warranty Expiry: ${data.asset_type}`,
      due_date: data.warranty_expiry,
      description: `Warranty for ${data.manufacturer} ${data.model} (${data.serial_number}) expires today.`
    })
  }

  // 2. Annual Service Reminder (1 year from install or now)
  const baseDate = data.install_date ? new Date(data.install_date) : new Date()
  const annualServiceDate = new Date(baseDate)
  annualServiceDate.setFullYear(annualServiceDate.getFullYear() + 1)

  reminders.push({
    org_id: job.org_id,
    asset_id: asset.id,
    title: `Annual Service: ${data.asset_type}`,
    due_date: annualServiceDate.toISOString().split('T')[0],
    description: `Scheduled annual service for ${data.manufacturer} ${data.model}.`
  })

  if (reminders.length > 0) {
    const { error: reminderError } = await supabase
      .from('property_maintenance_reminders')
      .insert(reminders)

    if (reminderError) {
      console.error('Failed to create reminders:', reminderError)
    }
  }

  revalidatePath(`/jobs/${jobId}`)
  return { success: true, assetId: asset.id }
}

export async function getAssetsByJobAction(jobId: string) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('property_assets')
    .select('*')
    .eq('job_id', jobId)

  if (error) throw error
  return data as PropertyAsset[]
}
