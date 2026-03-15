'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"

export default function LoginPage(){

const router = useRouter()

const [email,setEmail] = useState("")
const [password,setPassword] = useState("")
const [error,setError] = useState("")
const [loading,setLoading] = useState(false)

const handleLogin = async (e:any)=>{

e.preventDefault()
setLoading(true)
setError("")

const { data,error } = await supabase.auth.signInWithPassword({
email,
password
})

if(error){
setError(error.message)
setLoading(false)
return
}

router.push("/dashboard")

}

return(

<div className="flex min-h-screen items-center justify-center bg-black">

<div className="w-full max-w-md rounded-xl bg-neutral-900 p-8 shadow-xl">

<h1 className="text-3xl font-bold text-white mb-1">
TradeLife
</h1>

<p className="text-neutral-400 mb-6">
Built for Trades
</p>

<form onSubmit={handleLogin} className="space-y-4">

<input
type="email"
placeholder="Email"
required
value={email}
onChange={(e)=>setEmail(e.target.value)}
className="w-full rounded-lg bg-neutral-800 p-3 text-white"
/>

<input
type="password"
placeholder="Password"
required
value={password}
onChange={(e)=>setPassword(e.target.value)}
className="w-full rounded-lg bg-neutral-800 p-3 text-white"
/>

<button
type="submit"
disabled={loading}
className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white"
>

{loading ? "Signing in..." : "Sign In"}

</button>

</form>

{error && (
<p className="text-red-500 text-sm mt-4">{error}</p>
)}

<div className="flex justify-between text-sm text-neutral-400 mt-6">

<Link href="/signup">
Sign up
</Link>

<Link href="/forgot-password">
Forgot password
</Link>

</div>

</div>

</div>

)

}
