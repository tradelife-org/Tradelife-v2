'use client'

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function SignupPage() {

  const supabase = createClient()

    const [email, setEmail] = useState("")
      const [password, setPassword] = useState("")
        const [loading, setLoading] = useState(false)

          const handleSignup = async (e:any) => {
              e.preventDefault()

                  setLoading(true)

                      const { data, error } = await supabase.auth.signUp({
                            email,
                                  password
                                      })

                                          console.log("signup result:", data, error)

                                              if (error) {
                                                    alert(error.message)
                                                        } else {
                                                              alert("Account created. You can now log in.")
                                                                  }

                                                                      setLoading(false)
                                                                        }

                                                                          return (
                                                                              <div style={{padding:40}}>

                                                                                    <h1>Create TradeLife Account</h1>

                                                                                          <form onSubmit={handleSignup}>

                                                                                                  <input
                                                                                                            placeholder="Email"
                                                                                                                      value={email}
                                                                                                                                onChange={(e)=>setEmail(e.target.value)}
                                                                                                                                        />

                                                                                                                                                <br/><br/>

                                                                                                                                                        <input
                                                                                                                                                                  type="password"
                                                                                                                                                                            placeholder="Password"
                                                                                                                                                                                      value={password}
                                                                                                                                                                                                onChange={(e)=>setPassword(e.target.value)}
                                                                                                                                                                                                        />

                                                                                                                                                                                                                <br/><br/>

                                                                                                                                                                                                                        <button type="submit" disabled={loading}>
                                                                                                                                                                                                                                  {loading ? "Creating..." : "Sign Up"}
                                                                                                                                                                                                                                          </button>

                                                                                                                                                                                                                                                </form>

                                                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                                                      )
                                                                                                                                                                                                                                                      }