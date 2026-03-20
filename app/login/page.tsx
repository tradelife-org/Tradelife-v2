'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
  }

  function handleGoogle() {}

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center px-4 py-8" data-testid="login-page">
      <div className="w-full max-w-[420px]">

        {/* Branding with subtle glow */}
        <div className="mb-10 text-center" data-testid="login-branding">
          <h1
            className="text-4xl font-semibold tracking-tight text-white"
            style={{
              textShadow: '0 0 40px rgba(59,130,246,0.2), 0 0 80px rgba(59,130,246,0.08)',
            }}
            data-testid="login-brand-title"
          >
            TradeLife
          </h1>
          <p
            className="mt-2 text-sm text-white/55 tracking-wide"
            data-testid="login-brand-subtitle"
          >
            Built for trades
          </p>
        </div>

        {/* Perspective Glass Panel */}
        <div className="perspective-container" data-testid="login-panel-wrapper">
          <div
            className="login-glass-panel rounded-2xl p-6 sm:p-8"
            data-testid="login-panel"
          >
            {/* Edge lighting effects */}
            <div className="panel-edge-light-left" />
            <div className="panel-edge-light-right" />

            <form onSubmit={handleLogin} className="relative z-10 space-y-4" data-testid="login-form">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-white/70" data-testid="login-email-label">
                  Email
                </label>
                <input
                  data-testid="login-email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all duration-200 focus:border-[#3b82f6]/50 focus:bg-white/[0.07] focus:shadow-[0_0_0_2px_rgba(59,130,246,0.1)]"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-white/70" data-testid="login-password-label">
                  Password
                </label>
                <input
                  data-testid="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all duration-200 focus:border-[#3b82f6]/50 focus:bg-white/[0.07] focus:shadow-[0_0_0_2px_rgba(59,130,246,0.1)]"
                />
              </div>

              {/* Forgot password */}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-xs text-[#3b82f6]/80 hover:text-[#3b82f6] transition-colors"
                  data-testid="login-forgot-password"
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign in button with glow */}
              <button
                type="submit"
                className="login-btn-primary w-full rounded-lg py-2.5 text-sm font-medium text-white transition-all"
                data-testid="login-submit"
              >
                Sign in
              </button>
            </form>

            {/* Divider */}
            <div className="relative z-10 my-5 flex items-center gap-3" data-testid="login-divider">
              <div className="h-px flex-1 bg-white/[0.08]" />
              <span className="text-[10px] uppercase tracking-wider text-white/30">or</span>
              <div className="h-px flex-1 bg-white/[0.08]" />
            </div>

            {/* Google button */}
            <button
              onClick={handleGoogle}
              className="relative z-10 flex w-full items-center justify-center gap-2.5 rounded-lg border border-white/[0.08] bg-white/[0.04] py-2.5 text-sm text-white/80 transition-all duration-200 hover:bg-white/[0.08] hover:text-white hover:border-white/[0.12]"
              data-testid="login-google"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Footer */}
            <p className="relative z-10 mt-5 text-center text-xs text-white/40" data-testid="login-footer">
              Don&apos;t have an account?{' '}
              <span className="cursor-pointer text-[#3b82f6]/80 hover:text-[#3b82f6] transition-colors" data-testid="login-signup-link">
                Sign up
              </span>
            </p>
          </div>

          {/* Grounding shadow under panel */}
          <div className="panel-ground-shadow" data-testid="login-ground-shadow" />
        </div>
      </div>
    </div>
  )
}
