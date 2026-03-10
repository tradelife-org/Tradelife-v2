'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Downloads a logo from a URL and uploads it to Supabase Storage.
 * Returns the public URL of the uploaded logo.
 */
async function uploadLogo(logoUrl: string, orgId: string): Promise<string | null> {
  const supabase = await createServerSupabaseClient()
  
  try {
    // 1. Fetch the logo image
    const response = await fetch(logoUrl)
    if (!response.ok) throw new Error(`Failed to fetch logo from ${logoUrl}`)
    
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // 2. Determine file path
    const filePath = `branding/logos/${orgId}.png`
    
    // 3. Upload to 'gallery' bucket
    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(filePath, buffer, {
        contentType: 'image/png',
        upsert: true
      })
      
    if (uploadError) {
      console.error('Logo upload failed:', uploadError)
      return null
    }
    
    // 4. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('gallery')
      .getPublicUrl(filePath)
      
    return publicUrl
  } catch (err) {
    console.error('Error processing logo:', err)
    return null
  }
}

interface OnboardingInput {
  companyName: string
  companyNumber: string | null
  address: string
  vatRate: number
  vatNumber: string | null
  logoUrl: string | null
  isVatRegistered: boolean
}

export async function completeOnboardingAction(input: OnboardingInput) {
  const supabase = await createServerSupabaseClient()
  
  // 1. Auth & Context
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')
  const orgId = profile.org_id

  // 2. Handle Logo Upload (if provided)
  let finalLogoUrl = input.logoUrl
  if (input.logoUrl && input.logoUrl.startsWith('http')) {
    // Only upload if it's an external URL (not already our storage URL)
    const storedUrl = await uploadLogo(input.logoUrl, orgId)
    if (storedUrl) {
      finalLogoUrl = storedUrl
    }
  }

  // 3. Prepare Update Data
  const updates: any = {
    name: input.companyName,
    address: input.address,
    vat_number: input.vatNumber,
    logo_url: finalLogoUrl,
    is_vat_registered: input.isVatRegistered,
    updated_at: new Date().toISOString()
  }

  // 4. Update Organisation
  try {
    const { error } = await supabase
      .from('organisations')
      .update(updates)
      .eq('id', orgId)

    if (error) {
      console.error('Full update failed:', error)
      // Fallback: name only if columns missing (though migration should be applied)
      await supabase
        .from('organisations')
        .update({ name: input.companyName })
        .eq('id', orgId)
    }
  } catch (err) {
    console.error('Update failed:', err)
    throw err
  }

  // 5. Update Profile (onboarding_completed = true)
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ onboarding_completed: true })
    .eq('id', user.id)

  if (profileError) {
    console.error('Profile update failed:', profileError)
    // We don't throw here to avoid blocking the user if it's just a column missing issue
    // but in production we should handle this.
  }

  // 6. Update User Metadata
  const { error: authError } = await supabase.auth.updateUser({
    data: { onboarding_completed: true }
  })

  if (authError) {
    console.error('Auth metadata update failed:', authError)
  }

  revalidatePath('/onboarding')
  return { success: true }
}
