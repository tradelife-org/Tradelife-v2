'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogIn, Mail, Lock, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (!data.session) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
      return
    }

    // Login successful
    router.refresh()
    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-heading font-black text-slate-900 tracking-tight">
            TradeLife<span className="text-blueprint">.</span>
          </h1>
          <p className="mt-2 text-slate-500 font-body">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm" data-testid="login-error">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-slate-600">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="login-email"
                className="w-full h-12 pl-10 pr-3 text-base bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint"
                placeholder="you@company.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-slate-600">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="login-password"
                className="w-full h-12 pl-10 pr-3 text-base bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint"
                placeholder="Your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            data-testid="login-submit"
            className="w-full h-12 flex items-center justify-center gap-2 bg-blueprint text-white font-semibold rounded-xl hover:bg-blueprint-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="animate-pulse">Signing in...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Sign In
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-blueprint font-semibold hover:underline" data-testid="signup-link">
            Sign up <ArrowRight className="inline w-3 h-3" />
          </Link>
        </p>
      </div>
    </main>
  )
}
