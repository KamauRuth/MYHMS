"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { AdminRoute } from "@/components/AdminRoute"

const supabase = createClient()

interface StaffUser {
  id: string
  email: string
  role: string
  facility_id: string | null
  created_at: string
}

interface RegistrationForm {
  email: string
  password: string
  role: "DOCTOR" | "NURSE" | "LAB" | "PHARMACY" | "RECEPTION" | "FINANCE"
  facility_id: string
}

const ROLES = ["DOCTOR", "NURSE", "LAB", "PHARMACY", "RECEPTION", "FINANCE"]

function StaffRegistration() {
  const [users, setUsers] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [facilities, setFacilities] = useState<any[]>([])

  const [formData, setFormData] = useState<RegistrationForm>({
    email: "",
    password: "",
    role: "DOCTOR",
    facility_id: ""
  })

  // Load existing staff
  useEffect(() => {
    loadStaff()
  }, [])

  const loadStaff = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("profiles")
        .select("id, role, facility_id, created_at")
        .order("created_at", { ascending: false })

      if (!error && data) {
        const staffWithEmails = await Promise.all(
          data.map(async (profile: any) => {
            try {
              const { data: authData } = await supabase.auth.admin.getUserById(profile.id)
              return {
                id: profile.id,
                email: authData?.user?.email || "N/A",
                role: profile.role,
                facility_id: profile.facility_id,
                created_at: profile.created_at
              }
            } catch {
              return {
                id: profile.id,
                email: "N/A",
                role: profile.role,
                facility_id: profile.facility_id,
                created_at: profile.created_at
              }
            }
          })
        )
        setUsers(staffWithEmails)
      }
    } catch (err) {
      console.error("Error loading staff:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterStaff = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.password || !formData.role) {
      alert("Please fill in all fields")
      return
    }

    if (formData.password.length < 6) {
      alert("Password must be at least 6 characters")
      return
    }

    try {
      setRegistering(true)

      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: formData.role
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error("Failed to create user")

      // 2. Create profile record
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: authData.user.id,
          role: formData.role,
          facility_id: formData.facility_id || null,
          created_at: new Date().toISOString()
        })

      if (profileError) {
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id)
        throw profileError
      }

      alert(`✅ Staff registered successfully!\nEmail: ${formData.email}\nRole: ${formData.role}`)
      
      // Reset form
      setFormData({ email: "", password: "", role: "DOCTOR", facility_id: "" })
      setShowForm(false)

      // Reload staff list
      loadStaff()
    } catch (err: any) {
      console.error("Registration error:", err)
      alert(`Failed to register staff: ${err.message}`)
    } finally {
      setRegistering(false)
    }
  }

  const handleDeleteStaff = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return

    try {
      // Delete from profiles table (auth user will cascade)
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId)

      if (error) throw error

      alert("Staff member deleted successfully")
      loadStaff()
    } catch (err: any) {
      console.error("Delete error:", err)
      alert(`Failed to delete staff: ${err.message}`)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-gray-600">Register and manage system users</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
        >
          {showForm ? "Cancel" : "Register New Staff"}
        </button>
      </div>

      {/* Registration Form */}
      {showForm && (
        <form onSubmit={handleRegisterStaff} className="bg-white border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Register New Staff Member</h2>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <input
              type="email"
              placeholder="staff@hospital.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              placeholder="Min. 6 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          {/* Facility ID (optional) */}
          <div>
            <label className="block text-sm font-medium mb-1">Facility ID (Optional)</label>
            <input
              type="text"
              placeholder="e.g., facility-uuid"
              value={formData.facility_id}
              onChange={(e) => setFormData({ ...formData, facility_id: e.target.value })}
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={registering}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
          >
            {registering ? "Registering..." : "Register Staff"}
          </button>
        </form>
      )}

      {/* Staff List */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="p-6 border-b bg-gray-50">
          <h2 className="text-xl font-semibold">Registered Staff ({users.length})</h2>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading staff...</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No staff members registered yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Facility</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Registered</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3">{user.email}</td>
                    <td className="px-6 py-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        user.role === "ADMIN" ? "bg-red-100 text-red-800" :
                        user.role === "DOCTOR" ? "bg-blue-100 text-blue-800" :
                        user.role === "NURSE" ? "bg-green-100 text-green-800" :
                        user.role === "PHARMACY" ? "bg-purple-100 text-purple-800" :
                        user.role === "LAB" ? "bg-orange-100 text-orange-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">{user.facility_id || "-"}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => handleDeleteStaff(user.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default function UsersPage() {
  return (
    <AdminRoute>
      <StaffRegistration />
    </AdminRoute>
  )
}
