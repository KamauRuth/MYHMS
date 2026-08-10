"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface AdminRouteProps {
  children: React.ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        if (!supabase?.auth || typeof supabase.auth.getUser !== "function") {
          console.error("Supabase auth client is not initialized")
          router.push("/(auth)/sign-in")
          return
        }

        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError || !userData.user) {
          router.push("/(auth)/sign-in")
          return
        }

        // Check if user is admin
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userData.user.id)
          .maybeSingle()

        if (profileError || !profile) {
          router.push("/")
          return
        }

        if (profile.role !== "ADMIN") {
          // Show access denied and redirect
          alert("Access Denied: Only administrators can access this page")
          router.push("/")
          return
        }

        setIsAdmin(true)
        setLoading(false)
      } catch (err) {
        console.error("Access check error:", err)
        router.push("/")
      }
    }

    checkAdminAccess()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl font-semibold">Checking access...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return <>{children}</>
}
