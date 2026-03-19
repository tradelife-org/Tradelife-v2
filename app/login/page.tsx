'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { motion } from 'framer-motion'

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
      if (authError) { setError(authError.message); setLoading(false); return }
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      if (data.user?.onboarding_complete) { router.push('/dashboard') }
      else { router.push('/onboarding') }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--bg-base)' }}>
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.07] pointer-events-none"
        style={{ background: `radial-gradient(circle, var(--glow-primary), transparent 70%)` }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[400px] relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center edge-glow"
              style={{ background: 'var(--glow-primary)' }}>
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              TradeLife
            </span>
          </div>
          <h1 className="text-2xl font-bold mt-4" style={{ color: 'var(--text-primary)' }} data-testid="login-title">
            Welcome back
          </h1>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>
            Sign in to your command center
          </p>
        </div>

        {/* Form panel */}
        <div className="glass-panel-elevated p-6">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm px-4 py-3 rounded-lg"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}
                data-testid="login-error"
              >
                {error}
              </motion.div>
            )}

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider mb-2"
                style={{ color: 'var(--text-muted)' }}>Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="glass-input w-full px-4 py-3 text-sm"
                data-testid="login-email-input"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider mb-2"
                style={{ color: 'var(--text-muted)' }}>Password</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="glass-input w-full px-4 py-3 text-sm"
                data-testid="login-password-input"
              />
            </div>

            <button type="submit" disabled={loading}
              className="btn-glow w-full py-3 text-sm mt-2"
              data-testid="login-submit-button">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
          Don&apos;t have an account?{' '}
          <a href="/signup" className="font-medium hover:underline"
            style={{ color: 'var(--glow-primary)' }} data-testid="login-signup-link">
            Create one
          </a>
        </p>
      </motion.div>
    </main>
  )
}
