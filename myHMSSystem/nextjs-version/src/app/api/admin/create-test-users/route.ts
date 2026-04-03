import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Check if requester is admin
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .maybeSingle()

    if (!profile || profile.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can create test users" }, { status: 403 })
    }

    // Get body
    const body = await request.json()
    const { email, password, role, firstName, lastName } = body

    if (!email || !password || !role) {
      return NextResponse.json(
        { message: "Missing required fields: email, password, role" },
        { status: 400 }
      )
    }

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role }
      })

      if (authError) {
        return NextResponse.json(
          { message: authError.message },
          { status: 400 }
        )
      }

      if (!authData.user) {
        return NextResponse.json(
          { message: "Failed to create user" },
          { status: 500 }
        )
      }

      // Create profile
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: authData.user.id,
          role: role,
          created_at: new Date().toISOString()
        })

      if (profileError) {
        // Rollback: delete auth user
        await supabase.auth.admin.deleteUser(authData.user.id)
        return NextResponse.json(
          { message: `Profile creation failed: ${profileError.message}` },
          { status: 400 }
        )
      }

      // Create staff record
      const staffId = `${role.substring(0, 3).toUpperCase()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
      
      const { error: staffError } = await supabase
        .from("staff")
        .insert({
          id: crypto.randomUUID?.() || `sys-${Math.random().toString(36).substr(2, 9)}`,
          staff_id: staffId,
          first_name: firstName || role,
          last_name: lastName || "User",
          email: email,
          phone: `+254700${Math.floor(Math.random() * 9000000).toString().padStart(7, '0')}`,
          role: role,
          department: getDepartment(role),
          is_active: true,
          user_id: authData.user.id,
          created_at: new Date().toISOString()
        })

      if (staffError) {
        console.warn(`Staff record creation skipped: ${staffError.message}`)
      }

      return NextResponse.json({
        success: true,
        message: `User ${email} created successfully`,
        user: {
          id: authData.user.id,
          email: email,
          role: role
        }
      })
    } catch (err: any) {
      return NextResponse.json(
        { message: err.message || "Failed to create user" },
        { status: 500 }
      )
    }
  } catch (err: any) {
    console.error("Test user creation error:", err)
    return NextResponse.json({ message: err.message || "Server error" }, { status: 500 })
  }
}

function getDepartment(role: string): string {
  const deptMap: Record<string, string> = {
    DOCTOR: "OPD",
    NURSE: "OPD",
    LAB: "Laboratory",
    PHARMACY: "Pharmacy",
    RECEPTION: "Reception",
    FINANCE: "Finance",
    ADMIN: "Administration"
  }
  return deptMap[role] || "Other"
}

