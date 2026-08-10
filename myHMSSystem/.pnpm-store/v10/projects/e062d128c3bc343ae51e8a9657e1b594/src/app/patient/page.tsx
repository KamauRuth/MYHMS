"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const supabase = createClient()

export default function PatientLogin() {
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState("phone") // phone, otp, register
  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const sendOTP = async () => {
    if (!phone) return

    setLoading(true)
    // Check if patient exists
    const { data: existingPatient, error } = await supabase
      .from("patients")
      .select("*")
      .eq("phone", phone)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error checking patient", error)
      alert("Error checking patient record")
      setLoading(false)
      return
    }

    if (existingPatient) {
      setPatient(existingPatient)
      // In real implementation, send OTP via SMS
      alert(`OTP sent to ${phone}: 123456 (demo)`)
      setStep("otp")
    } else {
      // New patient - collect basic info
      setStep("register")
    }
    setLoading(false)
  }

  const verifyOTP = async () => {
    if (otp === "123456") { // Demo OTP
      // Store patient session (in real app, use proper auth)
      localStorage.setItem("patient_session", JSON.stringify({
        patient_id: patient.id,
        phone: patient.phone,
        name: `${patient.first_name} ${patient.last_name}`
      }))
      router.push("/patient/dashboard")
    } else {
      alert("Invalid OTP")
    }
  }

  const registerPatient = async (e: any) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    const newPatient = {
      first_name: formData.get("first_name"),
      last_name: formData.get("last_name"),
      phone: phone,
      date_of_birth: formData.get("date_of_birth"),
      gender: formData.get("gender"),
      address: formData.get("address")
    }

    const { data, error } = await supabase
      .from("patients")
      .insert([newPatient])
      .select()
      .single()

    if (error) {
      console.error("Failed to register patient", error)
      alert("Registration failed")
    } else {
      setPatient(data)
      alert(`OTP sent to ${phone}: 123456 (demo)`)
      setStep("otp")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">LIFEPOINT HOSPITAL</h1>
          <p className="text-gray-600">Patient Portal</p>
        </div>

        {step === "phone" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Enter Phone Number</h2>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              className="w-full border rounded px-3 py-2 mb-4"
            />
            <button
              onClick={sendOTP}
              disabled={loading || !phone}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Checking..." : "Continue"}
            </button>
          </div>
        )}

        {step === "otp" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Enter OTP</h2>
            <p className="text-sm text-gray-600 mb-4">
              OTP sent to {phone}
            </p>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              className="w-full border rounded px-3 py-2 mb-4"
              maxLength={6}
            />
            <button
              onClick={verifyOTP}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Verify OTP
            </button>
            <button
              onClick={() => setStep("phone")}
              className="w-full text-gray-600 py-2 mt-2"
            >
              Back
            </button>
          </div>
        )}

        {step === "register" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Complete Registration</h2>
            <form onSubmit={registerPatient} className="space-y-4">
              <input name="first_name" placeholder="First Name" required className="w-full border rounded px-3 py-2" />
              <input name="last_name" placeholder="Last Name" required className="w-full border rounded px-3 py-2" />
              <input name="date_of_birth" type="date" required className="w-full border rounded px-3 py-2" />
              <select name="gender" required className="w-full border rounded px-3 py-2">
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <textarea name="address" placeholder="Address" className="w-full border rounded px-3 py-2" rows={3} />
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                Register & Send OTP
              </button>
            </form>
            <button
              onClick={() => setStep("phone")}
              className="w-full text-gray-600 py-2 mt-2"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}