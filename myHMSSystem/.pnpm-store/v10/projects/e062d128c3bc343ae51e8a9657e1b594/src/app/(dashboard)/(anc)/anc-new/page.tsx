"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

const generateVisitNumber = () => `ANC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`

export default function ANCNew() {
  const router = useRouter()
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [triage, setTriage] = useState<any>(null)
  const [form, setForm] = useState({
    patient_id: "",
    visit_number: generateVisitNumber(),
    gestational_age_weeks: "",
    bp_systolic: "",
    bp_diastolic: "",
    weight: "",
    urine_protein: "",
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
      .from("anc_visits")
      .insert([
        {
          patient_id: form.patient_id,
          visit_number: form.visit_number,
          gestational_age_weeks: Number(form.gestational_age_weeks) || null,
          bp_systolic: form.bp_systolic || null,
          bp_diastolic: form.bp_diastolic || null,
          weight: Number(form.weight) || null,
          urine_protein: form.urine_protein || "",
          notes: form.notes || "",
          status: "COMPLETED",
        },
      ])

    setLoading(false)

    if (error) {
      console.error("Error creating ANC visit", error)
      alert("Failed to create ANC visit")
      return
    }

    alert("ANC visit recorded")
    router.push("/(anc)/anc-queue")
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">New ANC Visit</h1>

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
        </div>
      )}

      <label className="block mb-2">
        Visit Number
        <input
          type="text"
          value={form.visit_number}
          disabled
          className="w-full border rounded px-3 py-2 mt-1 bg-gray-100"
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
        BP Systolic
        <input
          type="number"
          value={form.bp_systolic}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, bp_systolic: e.target.value }))
          }
          className="w-full border rounded px-3 py-2 mt-1"
        />
      </label>

      <label className="block mb-2">
        BP Diastolic
        <input
          type="number"
          value={form.bp_diastolic}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, bp_diastolic: e.target.value }))
          }
          className="w-full border rounded px-3 py-2 mt-1"
        />
      </label>

      <label className="block mb-2">
        Weight (kg)
        <input
          type="number"
          step="0.1"
          value={form.weight}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, weight: e.target.value }))
          }
          className="w-full border rounded px-3 py-2 mt-1"
        />
      </label>

      <label className="block mb-2">
        Urine Protein
        <input
          type="text"
          value={form.urine_protein}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, urine_protein: e.target.value }))
          }
          className="w-full border rounded px-3 py-2 mt-1"
          placeholder="E.g., Negative, +1, +2"
        />
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
        {loading ? "Saving..." : "Record Visit"}
      </button>
    </div>
  )
}
