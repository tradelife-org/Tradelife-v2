'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
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

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      if (!data.session) {
        setError('Session not created. Please try again.')
        setLoading(false)
        return
      }

      const onboardingCompleted =
        data.user?.user_metadata?.onboarding_completed === true

      setLoading(false)

      if (onboardingCompleted) {
        router.push('/dashboard')
      } else {
        router.push('/onboarding')
      }

    } catch (err: any) {
      setError(err?.message || 'Login failed')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-12 relative z-10">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-heading font-black text-white tracking-tight drop-shadow-md">
            TradeLife<span className="text-safety-500">.</span>
          </h1>
          <p className="mt-2 text-slate-200 font-body drop-shadow-sm">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm" data-testid="login-error">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-slate-200">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="login-email"
                className="w-full h-12 pl-10 pr-3 text-base bg-white/90 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-500 focus:bg-white text-slate-900 placeholder:text-slate-400"
                placeholder="you@company.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-slate-200">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="login-password"
                className="w-full h-12 pl-10 pr-3 text-base bg-white/90 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-500 focus:bg-white text-slate-900 placeholder:text-slate-400"
                placeholder="Your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            data-testid="login-submit"
            className="w-full h-12 flex items-center justify-center gap-2 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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

        <p className="text-center text-sm text-slate-300 drop-shadow-sm">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-white font-bold hover:text-safety-400 transition-colors" data-testid="signup-link">
            Sign up <ArrowRight className="inline w-3 h-3" />
          </Link>
        </p>
      </div>
    </main>
  )
}
