'use server'

import { createServerSupabaseClient, adminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Downloads a logo from a URL and uploads it to Supabase Storage.
 * Returns the public URL of the uploaded logo.
 */
async function uploadLogo(logoUrl: string, orgId: string): Promise<string | null> {
  const supabase = await createServerSupabaseClient()
  
  try {
    const response = await fetch(logoUrl)
    if (!response.ok) throw new Error(`Failed to fetch logo from ${logoUrl}`)
    
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    const filePath = `branding/logos/${orgId}.png`
    
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
  let orgId = profile.org_id

  if (!orgId) {
    // 2. Insert Organisation if missing
    // STEP 3 - required fields only
    const { data: newOrg, error: orgError } = await adminClient
      .from('organisations')
      .insert([{ name: input.companyName }])
      .select()
      .single()

    if (orgError || !newOrg) {
      console.error('Organisation insert failed:', orgError)
      throw new Error(`Org creation failed: ${orgError?.message}`)
    }
    orgId = newOrg.id

    // Update with optional fields
    await adminClient.from('organisations').update({
      address: input.address,
      vat_number: input.vatNumber,
      is_vat_registered: input.isVatRegistered
    }).eq('id', orgId)
  } else {
    // 2. Update existing Organisation
    const { error: orgError } = await supabase
      .from('organisations')
      .update({
        name: input.companyName,
        address: input.address,
        vat_number: input.vatNumber,
        is_vat_registered: input.isVatRegistered
      })
      .eq('id', orgId)

    if (orgError) {
      console.error('Org update failed:', orgError)
      // Fallback: name only if columns missing (though migration should be applied)
      await supabase
        .from('organisations')
        .update({ name: input.companyName })
        .eq('id', orgId)
    }
  }

  // 3. Handle Logo Upload (if provided)
  let finalLogoUrl = input.logoUrl
  if (input.logoUrl && input.logoUrl.startsWith('http')) {
    const storedUrl = await uploadLogo(input.logoUrl, orgId)
    if (storedUrl) {
      finalLogoUrl = storedUrl
      await adminClient.from('organisations').update({ logo_url: finalLogoUrl }).eq('id', orgId)
    }
  }

  // 4. Update Profile
  const { error: profileError } = await adminClient
    .from('profiles')
    .update({ 
      org_id: orgId,
      active_org_id: orgId,
      onboarding_completed: true 
    })
    .eq('id', user.id)

  if (profileError) {
    console.error('Profile update failed:', profileError)
    throw new Error(`Profile update failed: ${profileError.message}`)
  }

  // 5. Update User Metadata
  const { error: authError } = await adminClient.auth.admin.updateUserById(user.id, {
    user_metadata: { onboarding_completed: true }
  })

  // Also update via client just in case the session needs to refresh (though redirect usually forces a refresh if middleware checks it properly)
  await supabase.auth.updateUser({
    data: { onboarding_completed: true }
  })

  if (authError) {
    console.error('Auth metadata update failed:', authError)
  }

  revalidatePath('/onboarding')
  return { success: true }
}
