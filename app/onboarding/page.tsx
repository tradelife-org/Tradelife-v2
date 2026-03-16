'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function OnboardingPage() {
  const router = useRouter()

  const [businessName, setBusinessName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreateOrganisation = async () => {
    if (!businessName) return

    setLoading(true)

    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user

    if (!user) {
      setLoading(false)
      return
    }

    const { data: org, error: orgError } = await supabase
      .from('organisations')
      .insert({
        name: businessName
      })
      .select()
      .single()

    if (orgError) {
      console.error('Org creation failed:', orgError)
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        org_id: org.id,
        active_org_id: org.id,
        onboarding_completed: true
      })
      .eq('id', user.id)

    if (profileError) {
      console.error('Profile update failed:', profileError)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-96 rounded-lg bg-neutral-900 p-8 text-white">
        <h1 className="mb-4 text-xl font-semibold">
          Welcome to TradeLife
        </h1>

        <p className="mb-4 text-sm text-gray-400">
          Let’s set up your business.
        </p>

        <input
          className="mb-4 w-full rounded bg-neutral-800 p-3"
          placeholder="Business name"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
        />

        <button
          onClick={handleCreateOrganisation}
          disabled={loading}
          className="w-full rounded bg-blue-600 p-3"
        >
          {loading ? 'Creating...' : 'Continue'}
        </button>
      </div>
    </div>
  )
}