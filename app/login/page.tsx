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

      {/* Depth */}
      <div className="absolute inset-0 bg-black/10" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">

        {/* LOGO */}
        <div className="text-center mb-12 relative">
          <h1 className="text-4xl md:text-5xl font-bold tracking-wide relative inline-block">
            TradeLife

            {/* LIGHT FLARE */}
            <span className="absolute left-[-20%] right-[-20%] top-1/2 h-[2px]
              bg-gradient-to-r from-transparent via-blue-400 to-transparent
              blur-md opacity-80" />

            {/* SOFT GLOW */}
            <span className="absolute inset-0 text-blue-400 blur-2xl opacity-20">
              TradeLife
            </span>
          </h1>

          <p className="text-gray-300 mt-2 text-sm md:text-base tracking-wide">
            Built for trades
          </p>
        </div>

        {/* LOGIN CARD */}
        <div className="
          relative
          w-full max-w-[340px] md:max-w-sm
          rounded-2xl
          backdrop-blur-2xl
          bg-white/5
          border border-white/10
          p-6
          shadow-[0_20px_60px_rgba(0,0,0,0.6)]
        ">

          {/* TOP LIGHT EDGE */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-[2px]
            bg-gradient-to-r from-transparent via-blue-400 to-transparent blur-md opacity-70" />

          {/* BOTTOM GLOW */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[3px]
            bg-blue-500 blur-xl opacity-40" />

          <h2 className="text-lg font-semibold mb-1 text-center">
            Welcome back
          </h2>

          <p className="text-gray-400 text-xs text-center mb-4">
            Your command centre is ready
          </p>

          <div className="space-y-4">

            <input
              type="email"
              placeholder="Email"
              className="w-full p-3 rounded-lg bg-white/5 border border-white/10 outline-none focus:border-blue-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 rounded-lg bg-white/5 border border-white/10 outline-none focus:border-blue-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* BUTTON WITH LIGHT SWEEP */}
            <button className="
              relative w-full py-3 rounded-lg overflow-hidden
              bg-gradient-to-r from-blue-500 to-blue-600
              shadow-[0_0_25px_rgba(59,130,246,0.5)]
            ">
              <span className="relative z-10">Sign in</span>

              {/* LIGHT SWEEP */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-30 blur-md" />
            </button>

          </div>

        </div>

      </div>
    </div>
  )
}
