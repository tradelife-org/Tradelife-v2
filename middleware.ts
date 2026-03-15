import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"

export async function middleware(req) {

const res = NextResponse.next()

const supabase = createServerClient(
process.env.NEXT_PUBLIC_SUPABASE_URL,
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
{
cookies:{
get:(name)=>req.cookies.get(name)?.value
}
}
)

const { data:{session} } = await supabase.auth.getSession()

const url = req.nextUrl.pathname

const publicRoutes = [
"/login",
"/signup",
"/forgot-password"
]

if(!session && !publicRoutes.includes(url)){
return NextResponse.redirect(new URL("/login", req.url))
}

return res

}
