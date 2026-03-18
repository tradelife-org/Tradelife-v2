const supabase = getSupabaseServerClient()
'use client'

import { useState } from 'react'
import { getSupabaseServerClient } from "../lib/supabase/server-safe"
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/onboarding')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="w-96 rounded-xl bg-neutral-900 p-8 text-white shadow-xl">
        <h1 className="mb-6 text-2xl font-bold">Sign up</h1>

        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md bg-neutral-800 px-4 py-2 text-white outline-none"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md bg-neutral-800 px-4 py-2 text-white outline-none"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-amber-500 py-2 font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-sm text-red-400">{error}</p>
        )}
      </div>
    </div>
  )
}
