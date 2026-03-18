'use server'

import { createServerSupabaseClient, adminClient } from '@/lib/supabase/server'
import { getUserWithOrg } from '@/lib/auth/getUser'
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

async function ensureValidOrganisation(user: any, requestedName: string) {
  const { org_id } = await getUserWithOrg()

  if (org_id) {
    return org_id
  }

  const fallbackName = requestedName || user?.user_metadata?.full_name || user?.email || 'New Org'
  const { data: newOrg, error: orgError } = await adminClient
    .from('organisations')
    .insert({ name: fallbackName })
    .select('id')
    .single()

  if (orgError || !newOrg) {
    console.error('Organisation guarantee failed:', orgError)
    return null
  }

  const { error: profileRepairError } = await adminClient
    .from('profiles')
    .upsert({
      id: user.id,
      org_id: newOrg.id,
      active_org_id: newOrg.id,
      full_name: user?.user_metadata?.full_name || user?.user_metadata?.name || null,
      email: user?.email || null,
      role: 'owner',
    }, { onConflict: 'id' })

  if (profileRepairError) {
    console.error('Profile repair after org creation failed:', profileRepairError)
  }

  return newOrg.id as string
}

export async function completeOnboardingAction(input: OnboardingInput) {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error('Onboarding auth fetch failed:', userError)
      return { success: false, error: 'Unauthorized' }
    }

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    let orgId = await ensureValidOrganisation(user, input.companyName)

    if (!orgId) {
      return { success: false, error: 'Unable to create organisation' }
    }

    const { data: existingOrg } = await adminClient
      .from('organisations')
      .select('id')
      .eq('id', orgId)
      .maybeSingle()

    if (!existingOrg) {
      orgId = await ensureValidOrganisation(user, input.companyName)
    }

    if (!orgId) {
      return { success: false, error: 'Unable to repair organisation' }
    }

    const { error: orgError } = await adminClient
      .from('organisations')
      .update({
        name: input.companyName,
        address: input.address,
        vat_number: input.vatNumber,
        is_vat_registered: input.isVatRegistered,
      })
      .eq('id', orgId)

    if (orgError) {
      console.error('Org update failed:', orgError)
      await adminClient
        .from('organisations')
        .update({ name: input.companyName })
        .eq('id', orgId)
    }

    let finalLogoUrl = input.logoUrl
    if (input.logoUrl && input.logoUrl.startsWith('http')) {
      const storedUrl = await uploadLogo(input.logoUrl, orgId)
      if (storedUrl) {
        finalLogoUrl = storedUrl
        await adminClient.from('organisations').update({ logo_url: finalLogoUrl }).eq('id', orgId)
      }
    }

    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id: user.id,
        org_id: orgId,
        active_org_id: orgId,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        email: user.email || null,
        role: 'owner',
        onboarding_completed: true,
      }, { onConflict: 'id' })

    if (profileError) {
      console.error('Profile update failed:', profileError)
      return { success: false, error: 'Unable to update profile' }
    }

    const { error: authError } = await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: { onboarding_completed: true }
    })

    await supabase.auth.updateUser({
      data: { onboarding_completed: true }
    })

    if (authError) {
      console.error('Auth metadata update failed:', authError)
    }

    revalidatePath('/onboarding')
    return { success: true }
  } catch (error) {
    console.error('Onboarding completion failed:', error)
    return { success: false, error: 'Unable to complete onboarding' }
  }
}
