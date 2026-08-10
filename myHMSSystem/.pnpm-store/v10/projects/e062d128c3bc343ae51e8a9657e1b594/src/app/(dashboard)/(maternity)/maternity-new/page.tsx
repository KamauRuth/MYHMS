"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function MaternityNew() {
  const router = useRouter()
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [triage, setTriage] = useState<any>(null)
  const [form, setForm] = useState({
    patient_id: "",
    gravida: "",
    parity: "",
    gestational_age_weeks: "",
    risk_level: "LOW",
    expected_delivery_date: "",
    last_menstrual_period: "",
    booking_date: "",
    notes: "",
  })

  useEffect(() => {
    const loadPatients = async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, first_name, last_name, phone")

      if (error) {
        console.error("Failed to load patients", error)
        return
      }

      setPatients(data || [])
    }

    loadPatients()
  }, [])

  // Fetch triage when patient is selected
  const handlePatientSelect = async (patientId: string) => {
    setForm((prev) => ({ ...prev, patient_id: patientId }))
    setTriage(null)

    if (!patientId) return

    // Get latest visit for patient
    const { data: visitData } = await supabase
      .from("visits")
      .select("id")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!visitData?.id) return

    // Get triage for that visit
    const { data: triageData, error } = await supabase
      .from("triage")
      .select("*")
      .eq("visit_id", visitData.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error("Failed to load triage", error)
    } else {
      setTriage(triageData)
    }
  }

  const submit = async () => {
    if (!form.patient_id) {
      alert("Please select a patient")
      return
    }

    setLoading(true)

    const { error } = await supabase
      .from("maternity_cases")
      .insert([
        {
          patient_id: form.patient_id,
          gravida: Number(form.gravida) || null,
          parity: Number(form.parity) || null,
          gestational_age_weeks: Number(form.gestational_age_weeks) || null,
          risk_level: form.risk_level,
          expected_delivery_date: form.expected_delivery_date || null,
          last_menstrual_period: form.last_menstrual_period || null,
          booking_date: form.booking_date || null,
          notes: form.notes || "",
          status: "ACTIVE",
        },
      ])

    setLoading(false)

    if (error) {
      console.error("Error creating maternity case", error)
      alert("Failed to create maternity case")
      return
    }

    alert("Maternity case created")
    router.push("/maternity-queue")
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">New Maternity Case</h1>

      <label className="block mb-2">
        Patient
        <select
          value={form.patient_id}
          onChange={(e) => handlePatientSelect(e.target.value)}
          className="w-full border rounded px-3 py-2 mt-1"
        >
          <option value="">Select patient</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.first_name} {p.last_name} {p.phone ? `(${p.phone})` : ""}
            </option>
          ))}
        </select>
      </label>

      {triage && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-semibold mb-2">Latest Triage Record</h3>
          <p className="text-sm">Temperature: {triage.temperature || "N/A"}°C</p>
          <p className="text-sm">BP: {triage.blood_pressure || "N/A"}</p>
          <p className="text-sm">Pulse: {triage.pulse || "N/A"} bpm</p>
          <p className="text-sm">Weight: {triage.weight || "N/A"} kg</p>
          <p className="text-xs text-gray-500 mt-2">
            Recorded {new Date(triage.created_at).toLocaleString()}
          </p>
        </div>
      )}

      <label className="block mb-2">
        Gravida
        <input
          type="number"
          value={form.gravida}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, gravida: e.target.value }))
          }
          className="w-full border rounded px-3 py-2 mt-1"
        />
      </label>

      <label className="block mb-2">
        Parity
        <input
          type="number"
          value={form.parity}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, parity: e.target.value }))
          }
          className="w-full border rounded px-3 py-2 mt-1"
        />
      </label>

      <label className="block mb-2">
        Gestational Age (weeks)
        <input
          type="number"
          value={form.gestational_age_weeks}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, gestational_age_weeks: e.target.value }))
          }
          className="w-full border rounded px-3 py-2 mt-1"
        />
      </label>

      <label className="block mb-2">
        Last Menstrual Period
        <input
          type="date"
          value={form.last_menstrual_period}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              last_menstrual_period: e.target.value,
            }))
          }
          className="w-full border rounded px-3 py-2 mt-1"
        />
      </label>

      <label className="block mb-2">
        Expected Delivery Date
        <input
          type="date"
          value={form.expected_delivery_date}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              expected_delivery_date: e.target.value,
            }))
          }
          className="w-full border rounded px-3 py-2 mt-1"
        />
      </label>

      <label className="block mb-2">
        Booking Date
        <input
          type="date"
          value={form.booking_date}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, booking_date: e.target.value }))
          }
          className="w-full border rounded px-3 py-2 mt-1"
        />
      </label>

      <label className="block mb-2">
        Risk Level
        <select
          value={form.risk_level}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, risk_level: e.target.value }))
          }
          className="w-full border rounded px-3 py-2 mt-1"
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
      </label>

      <label className="block mb-4">
        Notes
        <textarea
          value={form.notes}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, notes: e.target.value }))
          }
          className="w-full border rounded px-3 py-2 mt-1"
          rows={3}
        />
      </label>

      <button
        onClick={submit}
        disabled={loading}
        className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Create case"}
      </button>
    </div>
  )
}
