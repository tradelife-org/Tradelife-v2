'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password.trim()) { setError('Please enter both email and password.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: signUpData, error: authError } = await supabase.auth.signUp({ email: email.trim(), password })
      if (authError) { setError(authError.message); setLoading(false); return }
      if (signUpData.user) {
        await fetch('/api/auth/ensure-profile', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: signUpData.user.id, email: email.trim() }),
        })
      }
      router.push('/onboarding')
    } catch { setError('Something went wrong. Please try again.'); setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4" data-testid="signup-page">
      <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-lg shadow">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 mb-4">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900" data-testid="signup-title">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1">Start managing your trade finances</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="text-sm px-4 py-3 rounded-md bg-red-50 border border-red-200 text-red-700" data-testid="signup-error">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="border border-gray-300 rounded-md px-3 py-2 text-black bg-white w-full text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="signup-email-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="border border-gray-300 rounded-md px-3 py-2 text-black bg-white w-full text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="signup-password-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md w-full font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            data-testid="signup-submit-button"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium" data-testid="signup-login-link">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
