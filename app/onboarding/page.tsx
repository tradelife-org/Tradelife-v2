'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function OnboardingPage() {

  const router = useRouter()

  const [businessName, setBusinessName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreateOrganisation = async () => {

    console.log("STEP 1")

    const { data: userData } = await supabase.auth.getUser()

  // Step 3: Confirmation & Save
  const handleSave = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    if (!companyName) {
      setError('Company name is required')
      return
    }

    setLoading(true)

    const { data: org, error: orgError } = await supabase
      .from('organisations')
      .insert({ name: businessName })
      .select()
      .single()

    console.log("STEP 2", org, orgError)

    if (orgError) {
      alert("Org creation failed")
      console.error(orgError)
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

    console.log("STEP 3", profileError)

    if (profileError) {
      alert("Profile update failed")
      console.error(profileError)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">

      <div className="w-96 rounded-xl bg-neutral-900 p-8 text-white shadow-xl">

        <h1 className="text-xl font-semibold mb-2">
          Welcome to TradeLife
        </h1>

        <p className="text-sm text-gray-400 mb-6">
          Let’s set up your business.
        </p>

        <input
          className="w-full rounded bg-neutral-800 p-3 mb-4"
          placeholder="Business name"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
        />

        <button
          onClick={handleCreateOrganisation}
          disabled={loading}
          className="w-full rounded bg-blue-600 p-3"
        >
          {loading ? "Creating..." : "Continue"}
        </button>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    setStep(1)
                  }}
                  className="flex-1 h-11 px-4 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-[2] h-11 px-4 bg-blueprint text-white font-semibold rounded-xl hover:bg-blueprint-700 transition-colors shadow-lg shadow-blueprint/20 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <CheckCircle className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}