"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function DeliveryRecord() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const caseId = searchParams.get("caseId")

  const [maternityCase, setMaternityCase] = useState<any>(null)
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedCaseId, setSelectedCaseId] = useState(caseId || "")
  const [form, setForm] = useState({
    delivery_date: new Date().toISOString().split("T")[0],
    mode_of_delivery: "",
    baby_outcome: "",
    baby_gender: "",
    baby_weight: "",
    apgar_score_1min: "",
    apgar_score_5min: "",
    maternal_complication: "",
    perineal_trauma: "",
    blood_loss_ml: "",
    mother_outcome: "",
    notes: "",
  })

  useEffect(() => {
    const load = async () => {
      // Load all active maternity cases for selection
      const { data: allCases, error: casesError } = await supabase
        .from("maternity_cases")
        .select("id,patient:patients(*),gravida,parity,gestational_age_weeks,status")
        .eq("status", "ACTIVE")
        .order("created_at", { ascending: false })

      if (!casesError) {
        setCases(allCases || [])
      }

      // Load specific case if caseId provided
      if (selectedCaseId || caseId) {
        const id = selectedCaseId || caseId
        const { data, error } = await supabase
          .from("maternity_cases")
          .select("*,patient:patients(*)")
          .eq("id", id)
          .single()

        if (error) {
          console.error("Failed to load case", error)
        } else {
          setMaternityCase(data)
        }
      }
      setLoading(false)
    }

    load()
  }, [selectedCaseId, caseId])

  const submit = async () => {
    if (!selectedCaseId || !form.mode_of_delivery) {
      alert("Please select a case and mode of delivery")
      return
    }

    setSaving(true)

    // Update maternity case with delivery info
    const { error: updateError } = await supabase
      .from("maternity_cases")
      .update({
        status: "DELIVERED",
      })
      .eq("id", selectedCaseId)

    if (updateError) {
      console.error("Failed to update case", updateError)
      alert("Could not record delivery")
      setSaving(false)
      return
    }

    // Insert delivery record if delivery_records table exists
    const { error: deliveryError } = await supabase
      .from("delivery_records")
      .insert([
        {
          maternity_case_id: selectedCaseId,
          delivery_date: form.delivery_date,
          mode_of_delivery: form.mode_of_delivery,
          baby_outcome: form.baby_outcome,
          baby_gender: form.baby_gender,
          baby_weight: form.baby_weight || null,
          apgar_score_1min: form.apgar_score_1min || null,
          apgar_score_5min: form.apgar_score_5min || null,
          maternal_complication: form.maternal_complication,
          perineal_trauma: form.perineal_trauma,
          blood_loss_ml: form.blood_loss_ml || null,
          mother_outcome: form.mother_outcome,
          notes: form.notes || "",
        },
      ])

    setSaving(false)

    // Alert about delivery_records if it doesn't exist
    if (deliveryError?.code === "42P01") {
      alert("Delivery recorded in maternity case. (delivery_records table not found)")
    } else if (deliveryError) {
      console.warn("Could not record delivery details", deliveryError)
    } else {
      alert("Delivery recorded successfully")
    }

    router.push("/maternity-queue")
  }

  if (loading)
    return <p className="p-6">Loading cases...</p>

  if (!selectedCaseId) {
    return (
      <div className="p-6 max-w-2xl space-y-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4">Record Delivery</h1>
          <label className="block">
            <span className="font-semibold mb-2 block">Select Patient Case</span>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">-- Choose a patient --</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.patient?.first_name} {c.patient?.last_name} (GA: {c.gestational_age_weeks}w, G{c.gravida}P{c.parity})
                </option>
              ))}
            </select>
          </label>
          {cases.length === 0 && (
            <p className="text-gray-500 mt-4">No active maternity cases found</p>
          )}
        </div>
      </div>
    )
  }

  if (!maternityCase)
    return <p className="p-6">Case not found.</p>

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-2">Delivery Record</h1>
        <p className="text-lg">
          {maternityCase.patient?.first_name} {maternityCase.patient?.last_name}
        </p>
        <p className="text-sm text-gray-500">
          Gravida: {maternityCase.gravida}, Parity: {maternityCase.parity}
        </p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            Delivery Date
            <input
              type="date"
              value={form.delivery_date}
              onChange={(e) => setForm((prev) => ({ ...prev, delivery_date: e.target.value }))}
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </label>

          <label className="block">
            Mode of Delivery *
            <select
              value={form.mode_of_delivery}
              onChange={(e) => setForm((prev) => ({ ...prev, mode_of_delivery: e.target.value }))}
              className="w-full border rounded px-3 py-2 mt-1"
            >
              <option value="">Select</option>
              <option value="SVD">SVD (Spontaneous Vaginal)</option>
              <option value="Assisted">Assisted (Forceps/Vacuum)</option>
              <option value="Cesarean">Cesarean Section</option>
            </select>
          </label>

          <label className="block">
            Baby Gender
            <select
              value={form.baby_gender}
              onChange={(e) => setForm((prev) => ({ ...prev, baby_gender: e.target.value }))}
              className="w-full border rounded px-3 py-2 mt-1"
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </label>

          <label className="block">
            Baby Weight (kg)
            <input
              type="number"
              step="0.1"
              value={form.baby_weight}
              onChange={(e) => setForm((prev) => ({ ...prev, baby_weight: e.target.value }))}
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </label>

          <label className="block">
            Baby Outcome
            <select
              value={form.baby_outcome}
              onChange={(e) => setForm((prev) => ({ ...prev, baby_outcome: e.target.value }))}
              className="w-full border rounded px-3 py-2 mt-1"
            >
              <option value="">Select</option>
              <option value="Alive">Alive</option>
              <option value="Stillborn">Stillborn</option>
              <option value="IUFD">IUFD</option>
            </select>
          </label>

          <label className="block">
            APGAR 1 min
            <input
              type="number"
              min="0"
              max="10"
              value={form.apgar_score_1min}
              onChange={(e) => setForm((prev) => ({ ...prev, apgar_score_1min: e.target.value }))}
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </label>

          <label className="block">
            APGAR 5 min
            <input
              type="number"
              min="0"
              max="10"
              value={form.apgar_score_5min}
              onChange={(e) => setForm((prev) => ({ ...prev, apgar_score_5min: e.target.value }))}
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </label>

          <label className="block">
            Mother Outcome
            <select
              value={form.mother_outcome}
              onChange={(e) => setForm((prev) => ({ ...prev, mother_outcome: e.target.value }))}
              className="w-full border rounded px-3 py-2 mt-1"
            >
              <option value="">Select</option>
              <option value="Alive">Alive</option>
              <option value="Died">Died</option>
            </select>
          </label>

          <label className="block">
            Blood Loss (ml)
            <input
              type="number"
              value={form.blood_loss_ml}
              onChange={(e) => setForm((prev) => ({ ...prev, blood_loss_ml: e.target.value }))}
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </label>

          <label className="block col-span-2">
            Perineal Trauma
            <input
              type="text"
              value={form.perineal_trauma}
              onChange={(e) => setForm((prev) => ({ ...prev, perineal_trauma: e.target.value }))}
              className="w-full border rounded px-3 py-2 mt-1"
              placeholder="E.g., Episiotomy, Tear (2nd degree)"
            />
          </label>

          <label className="block col-span-2">
            Maternal Complications
            <textarea
              value={form.maternal_complication}
              onChange={(e) => setForm((prev) => ({ ...prev, maternal_complication: e.target.value }))}
              className="w-full border rounded px-3 py-2 mt-1"
              rows={2}
              placeholder="PPH, Eclampsia, Infection, etc."
            />
          </label>

          <label className="block col-span-2">
            Additional Notes
            <textarea
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full border rounded px-3 py-2 mt-1"
              rows={2}
            />
          </label>
        </div>

        <div className="flex gap-3">
          <button
            onClick={submit}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Recording..." : "Record Delivery"}
          </button>
          <button
            onClick={() => router.back()}
            className="border px-6 py-2 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
