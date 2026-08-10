/**
 * TEST USER GENERATION SCRIPT
 * 
 * This script creates test users in Supabase for development/testing
 * Run this in your browser console or integrate with your admin panel
 * 
 * Usage: 
 * 1. Copy and paste in browser DevTools console
 * 2. Or create an API route that calls this
 */

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export const TEST_USERS = [
  {
    email: "admin@hospital.com",
    password: "Admin@123456",
    role: "ADMIN",
    name: "System Administrator"
  },
  {
    email: "doctor1@hospital.com",
    password: "Doctor@123456",
    role: "DOCTOR",
    name: "Dr. James Smith"
  },
  {
    email: "doctor2@hospital.com",
    password: "Doctor@123456",
    role: "DOCTOR",
    name: "Dr. Sarah Johnson"
  },
  {
    email: "nurse1@hospital.com",
    password: "Nurse@123456",
    role: "NURSE",
    name: "Nurse Emily Brown"
  },
  {
    email: "nurse2@hospital.com",
    password: "Nurse@123456",
    role: "NURSE",
    name: "Nurse Michael Davis"
  },
  {
    email: "lab@hospital.com",
    password: "Lab@123456",
    role: "LAB",
    name: "Lab Technician"
  },
  {
    email: "pharmacy@hospital.com",
    password: "Pharmacy@123456",
    role: "PHARMACY",
    name: "Pharmacist"
  },
  {
    email: "reception@hospital.com",
    password: "Reception@123456",
    role: "RECEPTION",
    name: "Reception Officer"
  },
  {
    email: "finance@hospital.com",
    password: "Finance@123456",
    role: "FINANCE",
    name: "Finance Officer"
  }
]

export async function createTestUser(email: string, password: string, role: string) {
  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .neq("role", "")
      .limit(1)

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role }
      }
    })

    if (authError) throw authError
    if (!authData.user) throw new Error("Failed to create user")

    // Create profile
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: authData.user.id,
        role,
        created_at: new Date().toISOString()
      })

    if (profileError) {
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw profileError
    }

    return {
      success: true,
      email,
      role,
      userId: authData.user.id
    }
  } catch (err: any) {
    return {
      success: false,
      email,
      error: err.message
    }
  }
}

export async function createAllTestUsers() {
  console.log("🚀 Starting test user creation...")
  const results = []

  for (const user of TEST_USERS) {
    console.log(`Creating user: ${user.email} (${user.role})...`)
    const result = await createTestUser(user.email, user.password, user.role)
    results.push(result)
    
    if (result.success) {
      console.log(`✅ Created: ${user.email}`)
    } else {
      console.log(`❌ Failed: ${user.email} - ${result.error}`)
    }
  }

  console.log("\n📊 Summary:")
  console.log(`Total: ${results.length}`)
  console.log(`Successful: ${results.filter(r => r.success).length}`)
  console.log(`Failed: ${results.filter(r => !r.success).length}`)
  
  return results
}

// Browser console usage:
// import { createAllTestUsers } from '@/lib/testUsers'
// await createAllTestUsers()
