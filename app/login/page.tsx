'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.')
      return
    }

    setLoading(true)

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      // Check onboarding state
      const res = await fetch('/api/auth/me')
      const data = await res.json()

      if (data.user?.onboarding_complete) {
        router.push('/dashboard')
      } else {
        router.push('/onboarding')
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-heading font-bold text-slate-900 text-center mb-8" data-testid="login-title">
          Log in to TradeLife
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div
              className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3"
              data-testid="login-error"
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
              data-testid="login-email-input"
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
              placeholder="Your password"
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blueprint-400 focus:ring-1 focus:ring-blueprint-400 outline-none text-slate-800"
              data-testid="login-password-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-blueprint-600 text-white font-medium hover:bg-blueprint-700 disabled:opacity-50 transition-colors"
            data-testid="login-submit-button"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don&apos;t have an account?{' '}
          <a
            href="/signup"
            className="text-blueprint-600 hover:text-blueprint-700 font-medium"
            data-testid="login-signup-link"
          >
            Sign up
          </a>
        </p>
      </div>
    </main>
  )
}
