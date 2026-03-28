'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { motion } from 'framer-motion'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState(false)

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
      if (signUpData.session) {
        if (signUpData.user) {
          await fetch('/api/auth/ensure-profile', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: signUpData.user.id, email: email.trim() }),
          })
        }
        router.push('/onboarding')
      } else {
        setConfirmEmail(true)
        setLoading(false)
      }
    } catch { setError('Something went wrong. Please try again.'); setLoading(false) }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--bg-base)' }}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.07] pointer-events-none"
        style={{ background: `radial-gradient(circle, var(--glow-primary), transparent 70%)` }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-[400px] relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center edge-glow"
              style={{ background: 'var(--glow-primary)' }}>
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>TradeLife</span>
          </div>
          <h1 className="text-2xl font-bold mt-4" style={{ color: 'var(--text-primary)' }} data-testid="signup-title">
            Create your account
          </h1>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>
            Start managing your trade finances
          </p>
        </div>

        <div className="glass-panel-elevated p-6">
          {confirmEmail ? (
            <div
              className="text-sm px-4 py-5 rounded-lg text-center"
              style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#93c5fd' }}
              data-testid="signup-confirm-email"
            >
              Check your email to confirm your account before signing in.
            </div>
          ) : (
          <form onSubmit={handleSignup} className="space-y-5">
            {error && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="text-sm px-4 py-3 rounded-lg"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}
                data-testid="signup-error">{error}</motion.div>
            )}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" className="glass-input w-full px-4 py-3 text-sm" data-testid="signup-email-input" />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters" className="glass-input w-full px-4 py-3 text-sm" data-testid="signup-password-input" />
            </div>
            <button type="submit" disabled={loading} className="btn-glow w-full py-3 text-sm mt-2" data-testid="signup-submit-button">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          )}
        </div>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <a href="/login" className="font-medium hover:underline" style={{ color: 'var(--glow-primary)' }} data-testid="signup-login-link">Sign in</a>
        </p>
      </motion.div>
    </main>
  )
}
