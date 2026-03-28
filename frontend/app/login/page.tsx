'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    if (!supabase) {
      setError('Authentication service unavailable')
      setLoading(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    const next = searchParams.get('next') || '/'
    router.push(next)
    router.refresh()
  }

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">Login</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="you@example.com"
            data-testid="login-email-input"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Your password"
            data-testid="login-password-input"
          />
        </div>

        {error && (
          <div 
            className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm"
            data-testid="login-error-message"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="login-submit-button"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <a href="/signup" className="text-blue-600 hover:underline" data-testid="signup-link">
          Sign up
        </a>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
      <Suspense fallback={
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </main>
  )
}
