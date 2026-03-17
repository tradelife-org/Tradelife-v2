'use client'

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function OnboardingPage() {

  const router = useRouter()

  const [businessName, setBusinessName] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleContinue() {

    if (!businessName) return

    setLoading(true)

    const { data: userData } = await supabase.auth.getUser()

    const user = userData?.user

    if (!user) return

    // Create organisation
    const { data: org, error: orgError } = await supabase
      .from("organisations")
      .insert({
        name: businessName
      })
      .select()
      .single()

    if (orgError) {
      console.error(orgError)
      setLoading(false)
      return
    }

    // Attach user to organisation
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        org_id: org.id
      })
      .eq("id", user.id)

    if (profileError) {
      console.error(profileError)
      setLoading(false)
      return
    }

    router.push("/dashboard")
  }

  return (

    <div className="flex min-h-screen items-center justify-center bg-black">

      <div className="w-96 rounded-xl bg-zinc-900 p-8 shadow-xl">

        <h1 className="text-2xl font-bold text-white mb-4">
          Welcome to TradeLife
        </h1>

        <p className="text-zinc-400 mb-6">
          Let's set up your business.
        </p>

        <input
          className="w-full mb-4 p-3 rounded bg-zinc-800 text-white"
          placeholder="Business name"
          value={businessName}
          onChange={(e)=>setBusinessName(e.target.value)}
        />

        <button
          onClick={handleContinue}
          className="w-full bg-blue-600 text-white p-3 rounded"
        >
          {loading ? "Creating..." : "Continue"}
        </button>

      </div>

    </div>

  )
}
