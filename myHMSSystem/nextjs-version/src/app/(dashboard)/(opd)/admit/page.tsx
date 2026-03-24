"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { any } from "zod"

const supabase = createClient()

export default function AdmitPatient() {

  const router = useRouter()
  const searchParams = useSearchParams()

  const visitId = searchParams.get("visit_id")
  const patientId = searchParams.get("patients_id")

  console.log("visitId:", visitId)
  console.log("patientsId:", patientId)

  const [ward, setWard] = useState("")
  const [bed, setBed] = useState("")
  const [reason, setReason] = useState("")
  const [beds, setBeds] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // ✅ Fetch beds properly using useEffect
  useEffect(() => {
    async function fetchBeds() {
      const { data, error } = await supabase
        .from("beds")
        .select(`
          id,
          bed_number,
          wards(name)
        `)
        .eq("status", "AVAILABLE")

      if (error) {
        console.error("Error fetching beds:", error)
        return
      }

      setBeds(data || [])
    }

    fetchBeds()
  }, [])

  // ✅ Admit function
  async function admit() {

    if (!ward || !bed) {
      alert("Ward and bed are required")
      return
    }

    setLoading(true)

    const { error } = await supabase
      .from("admissions")
      .insert({
        visit_id: visitId,
        patient_id: patientId,
        ward: ward,
        bed_number: bed,
        reason: reason
      })

    if (error) {
      console.error(error)
      alert("Failed to admit patient")
      setLoading(false)
      return
    }

    alert("Patient admitted successfully")

    router.push("/ipd")
  }

  return (
    <div className="p-8 max-w-xl mx-auto space-y-6">

      <h1 className="text-2xl font-bold">Admit Patient to IPD</h1>

      <div className="space-y-4">

        {/* Ward Selection */}
        <div>
          <label className="block text-sm font-medium">Ward</label>
          <select
            value={ward}
            onChange={(e) => setWard(e.target.value)}
            className="w-full border rounded-lg p-2"
          >
            <option value="">Select Ward</option>
            <option value="Male Ward">Male Ward</option>
            <option value="Female Ward">Female Ward</option>
            <option value="Private Ward">Private Ward</option>
            <option value="ICU">ICU</option>
          </select>
        </div>

        {/* Bed Selection from DB */}
        <div>
          <label className="block text-sm font-medium">Bed Number</label>
          <select
            value={bed}
            onChange={(e) => setBed(e.target.value)}
            className="w-full border rounded-lg p-2"
          >
            <option value="">Select Bed</option>
            {beds.map((b) => (
              <option key={b.id} value={b.bed_number}>
                {b.bed_number} ({b.wards?.name})
              </option>
            ))}
          </select>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium">Reason for Admission</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border rounded-lg p-2"
            rows={3}
          />
        </div>

      </div>

      <button
        onClick={admit}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
      >
        {loading ? "Admitting..." : "Admit Patient"}
      </button>

    </div>
  )
}