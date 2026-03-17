'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { ensureOrgAndProfile } from '@/lib/actions/auth'
import { getAuthCallbackUrl } from '@/lib/utils/url'
import { UserPlus, Mail, Lock, User, ArrowRight } from 'lucide-react'

import SceneLayerV3 from "@/visual-engine/scene/SceneLayerV3"

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [success, setSuccess] = React.useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Using singleton
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: getAuthCallbackUrl(),
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Auto-seed org + profile (safety net if DB trigger not applied)
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        await ensureOrgAndProfile(data.user.id, email, fullName)
      }
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <SceneLayerV3 scene="remembrance">
        <main className="min-h-screen w-full flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md text-center space-y-6 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20">
            <Mail className="w-7 h-7 text-green-400" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-white" data-testid="signup-success">
            Check your email
          </h2>
          <p className="text-slate-300">
            We&apos;ve sent a confirmation link to <strong className="text-white">{email}</strong>.
            Click it to activate your account.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-white font-bold hover:text-safety-400 transition-colors"
          >
            Back to login <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        </main>
      </SceneLayerV3>
    )
  }

  return (
    <SceneLayerV3 scene="remembrance">
      <main className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-12 relative z-10">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-heading font-black text-white tracking-tight drop-shadow-md">
            TradeLife<span className="text-safety-500">.</span>
          </h1>
          <p className="mt-2 text-slate-200 font-body drop-shadow-sm">Create your free account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm" data-testid="signup-error">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="fullName" className="block text-sm font-medium text-slate-200">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                data-testid="signup-fullname"
                className="w-full h-12 pl-10 pr-3 text-base bg-white/90 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-500 focus:bg-white text-slate-900 placeholder:text-slate-400"
                placeholder="John Smith"
              />
            </div>
          </div>

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
                data-testid="signup-email"
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
                minLength={6}
                data-testid="signup-password"
                className="w-full h-12 pl-10 pr-3 text-base bg-white/90 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-500 focus:bg-white text-slate-900 placeholder:text-slate-400"
                placeholder="Min. 6 characters"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            data-testid="signup-submit"
            className="w-full h-12 flex items-center justify-center gap-2 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? (
              <span className="animate-pulse">Creating account...</span>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Create Account
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-300 drop-shadow-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-white font-bold hover:text-safety-400 transition-colors" data-testid="login-link">
            Sign in <ArrowRight className="inline w-3 h-3" />
          </Link>
        </p>
      </div>
    </main>
    </SceneLayerV3>
  )
}
