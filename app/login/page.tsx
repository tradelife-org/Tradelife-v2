'use client'

import { useState } from 'react'
import { Eye, ArrowRight, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div className="relative min-h-screen w-full overflow-hidden text-white">

      {/* BACKGROUND */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/tradelife-bg.png')" }}
      />

      {/* DEPTH */}
      <div className="absolute inset-0 bg-black/25" />

      {/* CONTENT */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">

        {/* LOGO + ARC */}
        <div className="mb-12 text-center relative">

          <div className="relative inline-block px-6">

            {/* CORE LIGHT */}
            <div className="absolute left-1/2 top-1/2 w-[140px] h-[30px] -translate-x-1/2 -translate-y-1/2 bg-blue-400 blur-2xl opacity-40 rounded-full" />

            {/* ARC FLARE */}
            <div className="absolute left-[-40%] right-[-40%] top-1/2 h-[4px] -translate-y-1/2 bg-gradient-to-r from-transparent via-blue-300 to-transparent blur-md opacity-100" />

            <h1 className="relative text-5xl md:text-6xl font-bold tracking-tight">
              TradeLife
            </h1>

          </div>

          <p className="text-white/70 mt-2">Built for trades</p>
        </div>

        {/* CARD */}
        <div className="relative w-full max-w-[340px] md:max-w-md">

          <div className="relative rounded-2xl border border-white/10 bg-black/40 backdrop-blur-3xl p-6 shadow-[0_20px_80px_rgba(0,0,0,0.8)] overflow-hidden">

            {/* 🔵 LEFT LIGHT */}
            <div className="absolute -left-16 top-0 w-[200px] h-full bg-blue-500/25 blur-3xl" />

            {/* 🟠 RIGHT LIGHT */}
            <div className="absolute -right-16 top-0 w-[200px] h-full bg-orange-400/25 blur-3xl" />

            {/* TOP EDGE LIGHT */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-[2px] bg-gradient-to-r from-transparent via-blue-300 to-transparent blur-md opacity-90" />

            {/* BOTTOM GLOW */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[3px] bg-orange-400 blur-xl opacity-50" />

            <div className="relative z-10">

              <h2 className="text-xl font-semibold mb-4 text-center">
                Welcome back
              </h2>

              <form className="space-y-4">

                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e)=>setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />

                <div className="relative">
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e)=>setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 pr-10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <Eye className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                </div>

                <div className="text-right text-sm">
                  <a href="/forgot-password" className="text-blue-400 hover:underline">
                    Forgot password?
                  </a>
                </div>

                {/* BUTTON = LIGHT SOURCE */}
                <button className="relative w-full bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition shadow-[0_0_40px_rgba(59,130,246,0.6)] group">
                  Sign in
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />

                  {/* LIGHT SPILL */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-40 blur-md" />
                </button>

                {/* DIVIDER */}
                <div className="flex items-center gap-4 my-4">
                  <div className="h-[1px] w-full bg-white/10"></div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest">OR</span>
                  <div className="h-[1px] w-full bg-white/10"></div>
                </div>

                <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-lg transition">
                  Continue with Google
                </button>

              </form>

              <p className="text-center text-sm text-gray-400 mt-6">
                Don’t have an account?{" "}
                <a href="/signup" className="text-blue-400 hover:underline">
                  Sign up
                </a>
              </p>

            </div>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-2 text-gray-500 text-xs uppercase tracking-widest">
          <ShieldCheck className="w-3 h-3" />
          Secure enterprise access
        </div>

      </div>
    </div>
  )
}
