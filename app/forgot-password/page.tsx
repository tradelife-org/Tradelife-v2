const supabase = getSupabaseServerClient()
'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabaseServerClient } from "../lib/supabase/server-safe"
import { Mail, ArrowRight, CheckCircle, Loader2 } from 'lucide-react'
import { getSiteUrl } from '@/lib/utils/url'
import SceneLayerV3 from "@/visual-engine/scene/SceneLayerV3"

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [success, setSuccess] = React.useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <SceneLayerV3 scene="remembrance">
        <main className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md space-y-8 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Check your email</h2>
          <p className="text-slate-300">
            We sent a password reset link to <strong className="text-white">{email}</strong>
          </p>
          <Link href="/login" className="inline-block mt-4 text-blueprint-400 hover:text-blueprint-300 font-medium">
            Return to login
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
        <div className="text-center">
          <h1 className="text-3xl font-heading font-black text-white tracking-tight drop-shadow-md">
            Reset Password
          </h1>
          <p className="mt-2 text-slate-200 font-body drop-shadow-sm">Enter your email to get a reset link</p>
        </div>

        <form onSubmit={handleReset} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
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
                className="w-full h-12 pl-10 pr-3 text-base bg-white/90 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-500 focus:bg-white text-slate-900 placeholder:text-slate-400"
                placeholder="you@company.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full h-12 flex items-center justify-center gap-2 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
          </button>
        </form>
        
        <p className="text-center text-sm text-slate-300 drop-shadow-sm">
          <Link href="/login" className="text-white font-bold hover:text-safety-400 transition-colors">
            Back to login <ArrowRight className="inline w-3 h-3" />
          </Link>
        </p>
      </div>
    </main>
    </SceneLayerV3>
  )
}
