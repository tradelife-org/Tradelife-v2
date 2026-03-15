'use client'

import { useState } from "react"

export default function OnboardingPage() {

  const [businessName, setBusinessName] = useState("")

  return (

    <div className="flex min-h-screen items-center justify-center bg-black">

      <div className="w-96 rounded-xl bg-zinc-900 p-8 shadow-xl">

        <h1 className="text-2xl font-bold text-white mb-4">
          Welcome to TradeLife
        </h1>

        <p className="text-zinc-400 mb-6">
          Let's set up your business.
        </p>

        <input
          className="w-full mb-4 p-3 rounded bg-zinc-800 text-white"
          placeholder="Business name"
          value={businessName}
          onChange={(e)=>setBusinessName(e.target.value)}
        />

        <button
          className="w-full bg-blue-600 text-white p-3 rounded"
        >
          Continue
        </button>

      </div>

    </div>

  )
}
