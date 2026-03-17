'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Lock, Loader2 } from 'lucide-react'
import SceneLayerV3 from "@/visual-engine/scene/SceneLayerV3"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    alert("Password updated successfully!")
    router.push('/login')
  }

  return (
    <SceneLayerV3 scene="remembrance">
      <main className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-12 relative z-10">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-heading font-black text-white tracking-tight drop-shadow-md">
            New Password
          </h1>
          <p className="mt-2 text-slate-200 font-body drop-shadow-sm">Enter your new password below</p>
        </div>

        <form onSubmit={handleUpdate} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-slate-200">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full h-12 pl-10 pr-3 text-base bg-white/90 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-500 focus:bg-white text-slate-900 placeholder:text-slate-400"
                placeholder="Min 6 characters"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || password.length < 6}
            className="w-full h-12 flex items-center justify-center gap-2 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
          </button>
        </form>
      </div>
    </main>
    </SceneLayerV3>
  )
}
