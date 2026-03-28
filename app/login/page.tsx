'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, ArrowRight, ShieldCheck, Mail, Lock } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const nextTarget = (() => {
    const next = searchParams.get('next')
    return next && next.startsWith('/') ? next : '/quotes'
  })()

  useEffect(() => {
    let active = true

    async function checkSession() {
      try {
        const supabase = createClient()
        const { data } = await supabase.auth.getSession()

        if (active && data.session) {
          router.replace(nextTarget)
          router.refresh()
        }
      } catch (sessionError) {
        console.error('Session check failed', sessionError)
      }
    }

    checkSession()

    return () => {
      active = false
    }
  }, [nextTarget, router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (authError) {
        console.error('Login failed:', authError.message)
        setError(authError.message)
        setLoading(false)
        return
      }
      router.replace(nextTarget)
      router.refresh()
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden text-white" data-testid="login-page">

      {/* BACKGROUND */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/tradelife-bg.png')" }}
        data-testid="login-background"
      />

      {/* DEPTH OVERLAY */}
      <div className="absolute inset-0 bg-black/25" />

      {/* CONTENT */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">

        {/* ═══ LOGO TREATMENT ═══ */}
        <div className="mb-8 text-center relative" data-testid="logo-block">

          {/* Arc container — spans wider than text */}
          <div className="relative mx-auto" style={{ width: '700px', maxWidth: '90vw' }}>

            {/* Core ambient glow */}
            <div className="logo-core-glow" />

            {/* Wordmark — centered inside the arc container */}
            <div className="relative inline-block w-full text-center">
              {/* Environment blend */}
              <div className="wordmark-env-cool" />
              <div className="wordmark-env-warm" />

              {/* Glow text layer — cinematic light emission */}
              <span
                className="wordmark-glow text-5xl md:text-[3.75rem] leading-tight select-none"
                aria-hidden="true"
              >
                TradeLife
              </span>

              {/* Gradient text — the visible wordmark */}
              <h1
                className="tradelife-wordmark text-5xl md:text-[3.75rem] leading-tight"
                data-testid="tradelife-wordmark"
              >
                TradeLife
              </h1>
            </div>

            {/* Blue energy arc — rendered ON TOP with screen blend for additive glow */}
            <div className="logo-arc-halo" />
            <div className="logo-arc-bloom" />
            <div className="logo-arc" />
          </div>

          {/* Tagline */}
          <p
            className="mt-2.5 text-[11px] tracking-[0.2em] flex items-center justify-center gap-3"
            style={{ color: 'rgba(220, 225, 235, 0.42)' }}
            data-testid="tradelife-tagline"
          >
            <span className="tagline-line" />
            <span className="font-light">Built for trades</span>
            <span className="tagline-line" />
          </p>
        </div>

        {/* ═══ GLASS SIGN-IN PANEL ═══ */}
        <div className="perspective-container w-full max-w-[380px]" data-testid="login-panel-container">

          <div className="login-glass-panel rounded-2xl p-7" data-testid="login-glass-panel">

            {/* Edge lighting */}
            <div className="panel-edge-light-left" />
            <div className="panel-edge-light-right" />
            <div className="panel-ambient-left" />
            <div className="panel-ambient-right" />

            {/* Bottom accent glows */}
            <div className="panel-bottom-glow-left" />
            <div className="panel-bottom-glow-right" />

            {/* Panel content */}
            <div className="relative z-10">

              {/* Heading */}
              <h2
                className="text-xl font-semibold text-white mb-1"
                data-testid="welcome-heading"
              >
                Welcome back
              </h2>
              <p
                className="text-sm text-white/45 mb-7"
                data-testid="welcome-subtext"
              >
                Your command centre is ready
              </p>

              <form onSubmit={handleLogin} className="space-y-5" data-testid="login-form">

                {/* Error message */}
                {error && (
                  <div
                    className="text-sm px-4 py-3 rounded-lg"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}
                    data-testid="login-error"
                  >
                    {error}
                  </div>
                )}

                {/* Email field */}
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5 tracking-wide" data-testid="email-label">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="login-input w-full py-3 pl-10 pr-4 text-sm"
                      data-testid="email-input"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-white/60 tracking-wide" data-testid="password-label">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      data-testid="forgot-password-link"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="login-input w-full py-3 pl-10 pr-10 text-sm"
                      data-testid="password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50 transition-colors"
                      data-testid="toggle-password-visibility"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Sign in button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="login-btn-primary w-full text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 group"
                  data-testid="sign-in-button"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                  {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </button>

                {/* OR divider */}
                <div className="flex items-center gap-4" data-testid="or-divider">
                  <div className="h-px flex-1 bg-white/8" />
                  <span className="text-[10px] text-white/30 uppercase tracking-[0.2em]">OR</span>
                  <div className="h-px flex-1 bg-white/8" />
                </div>

                {/* Google button */}
                <button
                  type="button"
                  onClick={async () => {
                    const supabase = createClient()
                    const { error: oauthErr } = await supabase.auth.signInWithOAuth({
                      provider: 'google',
                      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextTarget)}` },
                    })
                    if (oauthErr) {
                      console.error('Google OAuth error:', oauthErr.message)
                      setError(oauthErr.message)
                    }
                  }}
                  className="login-btn-google w-full text-white font-medium py-3 flex items-center justify-center gap-2.5"
                  data-testid="google-sign-in-button"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>

              </form>

              {/* Footer text */}
              <p className="text-center text-sm text-white/35 mt-6" data-testid="signup-text">
                Don&apos;t have an account?{' '}
                <Link
                  href={`/signup${nextTarget !== '/quotes' ? `?next=${encodeURIComponent(nextTarget)}` : ''}`}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                  data-testid="signup-link"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>

          {/* Ground shadow */}
          <div className="panel-ground-shadow" data-testid="panel-ground-shadow" />
        </div>

        {/* Secure enterprise access */}
        <div
          className="mt-10 flex items-center gap-2 text-white/30 text-xs uppercase tracking-[0.15em]"
          data-testid="secure-enterprise-text"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Secure enterprise access
        </div>

      </div>
    </div>
  )
}
