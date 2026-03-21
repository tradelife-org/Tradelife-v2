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

      {/* Subtle depth only */}
      <div className="absolute inset-0 bg-black/10" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">

        {/* LOGO */}
        <div className="text-center mb-10 relative">
          <h1 className="text-5xl font-bold tracking-wide relative inline-block">
            TradeLife

            {/* BLUE ARC GLOW */}
            <span className="absolute left-0 right-0 -bottom-2 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent blur-sm opacity-80" />
          </h1>

          <p className="text-gray-300 mt-2 tracking-wide">
            Built for trades
          </p>
        </div>

        {/* LOGIN CARD */}
        <div className="w-full max-w-md rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 p-6 shadow-[0_0_40px_rgba(0,0,0,0.4)]">

          <h2 className="text-xl font-semibold mb-4">
            Welcome back
          </h2>

          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 outline-none focus:border-blue-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 outline-none focus:border-blue-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 transition shadow-lg">
              Sign in
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
