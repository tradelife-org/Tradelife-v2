const supabase = getSupabaseServerClient()
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseServerClient } from "../lib/supabase/server-safe"

export default function OnboardingPage() {
  const router = useRouter()

  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not found')
      }

      // 1. Create organisation
      const { data: org, error: orgError } = await supabase
        .from('organisations')
        .insert([{ name: companyName }])
        .select()
        .single()

      if (orgError || !org) {
        throw new Error(orgError?.message || 'Org creation failed')
      }

      // 2. Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          org_id: org.id,
          active_org_id: org.id,
          onboarding_completed: true,
        })
        .eq('id', user.id)

      if (profileError) {
        throw new Error(profileError.message)
      }

      // 3. Redirect
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="w-96 rounded-xl bg-neutral-900 p-8 text-white shadow-xl">
        <h1 className="mb-6 text-2xl font-bold">Create your organisation</h1>

        <form onSubmit={handleCreate} className="space-y-4">
          <input
            type="text"
            placeholder="Company name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full rounded-md bg-neutral-800 px-4 py-2 text-white outline-none"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-amber-500 py-2 font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-sm text-red-400">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}