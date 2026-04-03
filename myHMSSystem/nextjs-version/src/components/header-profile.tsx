"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { CircleUser, LogOut, Settings } from "lucide-react"

interface UserProfile {
  email: string
  role: string
}

export function HeaderProfile() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError || !userData.user) {
          setLoading(false)
          return
        }

        // Get user's profile from database
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userData.user.id)
          .maybeSingle()

        if (!profileError && userData.user.email) {
          setProfile({
            email: userData.user.email,
            role: profileData?.role || "USER"
          })
        }
      } catch (err) {
        console.error("Failed to load profile:", err)
      } finally {
        setLoading(false)
      }
    }

    loadUserProfile()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/sign-in")
  }

  if (loading || !profile) {
    return (
      <Button variant="ghost" size="icon">
        <CircleUser className="h-5 w-5" />
      </Button>
    )
  }

  // Get role color and display name
  const getRoleColor = (role: string) => {
    const roleColors: { [key: string]: string } = {
      ADMIN: "text-red-600",
      DOCTOR: "text-blue-600",
      NURSE: "text-green-600",
      LAB: "text-orange-600",
      PHARMACY: "text-purple-600",
      RECEPTION: "text-cyan-600",
      FINANCE: "text-indigo-600"
    }
    return roleColors[role] || "text-gray-600"
  }

  const getRoleLabel = (role: string) => {
    const labels: { [key: string]: string } = {
      ADMIN: "Administrator",
      DOCTOR: "Doctor",
      NURSE: "Nurse",
      LAB: "Lab Technician",
      PHARMACY: "Pharmacist",
      RECEPTION: "Reception",
      FINANCE: "Finance Officer"
    }
    return labels[role] || role
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <CircleUser className="h-5 w-5" />
          <span className="sr-only">Open user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col space-y-1 py-2">
          <p className="text-sm font-medium leading-none text-foreground">
            {profile.email.split("@")[0] || "Staff"}
          </p>
          <p className="text-xs leading-none text-muted-foreground">
            {profile.email}
          </p>
          <div className="pt-1">
            <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full bg-opacity-10 ${getRoleColor(profile.role)}`}>
              {getRoleLabel(profile.role)}
            </span>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="cursor-pointer">
            <a href="/settings/account" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </a>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
