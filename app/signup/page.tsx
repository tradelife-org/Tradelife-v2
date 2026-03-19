'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data: signUpData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      // Ensure profile row exists
      if (signUpData.user) {
        await fetch('/api/auth/ensure-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: signUpData.user.id,
            email: email.trim(),
          }),
        })
      }

      router.push('/onboarding')
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-heading font-bold text-slate-900 text-center mb-8" data-testid="signup-title">
          Create your account
        </h1>

        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div
              className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3"
              data-testid="signup-error"
            >
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blueprint-400 focus:ring-1 focus:ring-blueprint-400 outline-none text-slate-800"
              data-testid="signup-email-input"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blueprint-400 focus:ring-1 focus:ring-blueprint-400 outline-none text-slate-800"
              data-testid="signup-password-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-blueprint-600 text-white font-medium hover:bg-blueprint-700 disabled:opacity-50 transition-colors"
            data-testid="signup-submit-button"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <a
            href="/login"
            className="text-blueprint-600 hover:text-blueprint-700 font-medium"
            data-testid="signup-login-link"
          >
            Log in
          </a>
        </p>
      </div>
    </main>
  )
}
