import "server-only"

import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { type CurrentStaff, isStaffRole, type StaffRole } from "@/lib/auth/roles"

export async function getCurrentStaff(): Promise<CurrentStaff | null> {
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) return null

  const [{ data: profile }, { data: staff }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", authData.user.id).maybeSingle(),
    supabase
      .from("staff")
      .select("first_name,last_name,department")
      .eq("user_id", authData.user.id)
      .maybeSingle(),
  ])

  const metadataRole = authData.user.user_metadata?.role
  const role = isStaffRole(profile?.role)
    ? profile.role
    : isStaffRole(metadataRole)
      ? metadataRole
      : null

  if (!role) return null

  const email = authData.user.email ?? ""
  const emailName = email.split("@")[0] || "Staff"

  return {
    id: authData.user.id,
    email,
    firstName: staff?.first_name || emailName,
    lastName: staff?.last_name || "",
    role,
    department: staff?.department || null,
  }
}

export async function requireStaff(allowedRoles?: readonly StaffRole[]) {
  const staff = await getCurrentStaff()

  if (!staff) {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    redirect(data.user ? "/errors/forbidden" : "/sign-in")
  }
  if (allowedRoles && !allowedRoles.includes(staff.role)) {
    redirect("/errors/forbidden")
  }

  return staff
}
