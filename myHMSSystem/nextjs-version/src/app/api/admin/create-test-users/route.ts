import { NextResponse } from "next/server"
import { z } from "zod"

import { staffRoles } from "@/lib/auth/roles"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

const createStaffSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(10).max(128),
  role: z.enum(staffRoles),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
})

const departments: Record<(typeof staffRoles)[number], string> = {
  ADMIN: "Administration",
  DOCTOR: "OPD",
  NURSE: "Nursing",
  LAB: "Laboratory",
  PHARMACY: "Pharmacy",
  RECEPTION: "Reception",
  FINANCE: "Finance",
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()

  if (!authData.user) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle()

  if (profile?.role !== "ADMIN") {
    return NextResponse.json({ message: "Administrator access required" }, { status: 403 })
  }

  const parsed = createStaffSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message || "Invalid staff details" },
      { status: 400 }
    )
  }

  const { email, password, role, firstName, lastName } = parsed.data

  try {
    const admin = createAdminClient()
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role, first_name: firstName, last_name: lastName },
    })

    if (createError || !created.user) {
      return NextResponse.json(
        { message: createError?.message || "Staff account could not be created" },
        { status: 400 }
      )
    }

    const staffId = `${role.slice(0, 3)}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
    const { error: recordsError } = await admin.from("profiles").upsert({
      id: created.user.id,
      role,
      created_at: new Date().toISOString(),
    })

    if (!recordsError) {
      const { error: staffError } = await admin.from("staff").insert({
        id: crypto.randomUUID(),
        staff_id: staffId,
        first_name: firstName,
        last_name: lastName,
        email,
        role,
        department: departments[role],
        is_active: true,
        user_id: created.user.id,
        created_at: new Date().toISOString(),
      })

      if (!staffError) {
        return NextResponse.json({ success: true, user: { id: created.user.id, email, role } })
      }
    }

    await admin.auth.admin.deleteUser(created.user.id)
    return NextResponse.json(
      { message: recordsError?.message || "Staff profile could not be created" },
      { status: 500 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Staff account could not be created"
    return NextResponse.json({ message }, { status: 503 })
  }
}
