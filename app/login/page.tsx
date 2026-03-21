'use client'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div className="relative min-h-screen w-full overflow-hidden text-white">

      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/tradelife-bg.png')" }}
      />

      {/* subtle depth */}
      <div className="absolute inset-0 bg-black/5" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">

        {/* Logo */}
        <div className="text-center mb-10 relative">
          <h1 className="text-5xl font-bold tracking-wide relative inline-block">
            TradeLife

            {/* glow */}
            <span className="absolute inset-0 blur-xl bg-blue-500/20 opacity-70" />

            {/* arc */}
            <span className="absolute left-0 right-0 -bottom-2 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent blur-sm opacity-90" />
          </h1>

          <p className="text-sm text-white/70 mt-2">Built for trades</p>
        </div>

        {/* Card */}
        <div className="w-full max-w-md backdrop-blur-2xl bg-white/10 border border-white/20 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.3)] p-8">

          <h2 className="text-xl font-semibold mb-4">Welcome back</h2>

          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50 mb-4" />

          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition shadow-[0_0_20px_rgba(59,130,246,0.6)]">
              Sign in →
            </button>
          </div>

        </div>

      </div>
    </div>
  )
}
