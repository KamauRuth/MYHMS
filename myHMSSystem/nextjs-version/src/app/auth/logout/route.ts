import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

import { browserSessionCookie } from "@/lib/auth/session"

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/sign-in", request.url))
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  await supabase.auth.signOut()
  response.cookies.set(browserSessionCookie, "", { path: "/", maxAge: 0, sameSite: "strict" })
  return response
}
