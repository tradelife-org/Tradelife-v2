'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignupPage() {

  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup() {

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password
    })

    if (!error) {
      router.push('/onboarding')
    }

    setLoading(false)
  }

  return (

    <div className="flex min-h-screen items-center justify-center bg-black">

      <div className="w-96 rounded-xl bg-zinc-900 p-8 shadow-xl">

        <h1 className="text-2xl font-bold text-white mb-6">
          Create TradeLife Account
        </h1>

        <input
          className="w-full mb-4 p-3 rounded bg-zinc-800 text-white"
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full mb-4 p-3 rounded bg-zinc-800 text-white"
          placeholder="Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
        />

        <button
          onClick={handleSignup}
          className="w-full bg-blue-600 text-white p-3 rounded"
        >
          {loading ? "Creating..." : "Sign Up"}
        </button>

      </div>

    </div>

  )
}
