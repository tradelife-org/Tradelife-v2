'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"

export default function Home(){

const router = useRouter()

useEffect(()=>{

const checkUser = async()=>{

const { data } = await supabase.auth.getSession()

if(!data.session){
router.push("/login")
}else{
router.push("/dashboard")
}

}

checkUser()

},[])

return null

}
