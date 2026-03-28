"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function MaternityCasePage() {
  const { id } = useParams()
  const [maternityCase, setMaternityCase] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [edit, setEdit] = useState(false)
  const [formData, setFormData] = useState({
    gravida: "",
    parity: "",
    gestational_age_weeks: "",
    risk_level: "LOW",
    expected_delivery_date: "",
    last_menstrual_period: "",
    booking_date: "",
    notes: "",
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return

    const load = async () => {
      const { data, error } = await supabase
        .from("maternity_cases")
        .select(`
          *,
          patient:patients (*)
        `)
        .eq("id", id)
        .single()

      if (error) {
        console.error("Failed to load maternity case", error)
      } else {
        setMaternityCase(data)
      }
  setFormData({
          gravida: data.gravida || "",
          parity: data.parity || "",
          gestational_age_weeks: data.gestational_age_weeks || "",
          risk_level: data.risk_level || "LOW",
          expected_delivery_date: data.expected_delivery_date || "",
          last_menstrual_period: data.last_menstrual_period || "",
          booking_date: data.booking_date || "",
          notes: data.notes || "",
        })
      
      setLoading(false)
    }

    load()
  }, [id])

  const updateCase = async () => {
    if (!id) return

    setSaving(true)

    const { error } = await supabase
      .from("maternity_cases")
      .update({
        gravida: Number(formData.gravida) || null,
        parity: Number(formData.parity) || null,
        gestational_age_weeks: Number(formData.gestational_age_weeks) || null,
        risk_level: formData.risk_level,
        expected_delivery_date: formData.expected_delivery_date || null,
        last_menstrual_period: formData.last_menstrual_period || null,
        booking_date: formData.booking_date || null,
        notes: formData.notes || "",
      })
      .eq("id", id)

    setSaving(false)

    if (error) {
      console.error("Failed to update maternity case", error)
      alert("Could not update case")
      return
    }

    alert("Case updated")
    setEdit(false)

    const { data, error: refreshError } = await supabase
      .from("maternity_cases")
      .select(`
        *,
        patient:patients (*)
      `)
      .eq("id", id)
      .single()

    if (!refreshError) {
      setMaternityCase(data)
    }
  }

  const router = useRouter()

  if (loading) return <p className="p-6">Loading case...</p>
  if (!maternityCase) return <p className="p-6">Case not found.</p>

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Maternity Case</h1>
            <p className="text-lg">
              {maternityCase.patient?.first_name} {maternityCase.patient?.last_name}
            </p>
            <p className="text-sm text-gray-500">
              Case ID: {maternityCase.id} • Created: {new Date(maternityCase.created_at).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/delivery-record?caseId=${maternityCase.id}`)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Record Delivery
            </button>
            <button
              onClick={() => setEdit(!edit)}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              {edit ? "Cancel" : "Edit"}
            </button>
          </div>
        </div>

        {!edit ? (
          <div className="space-y-2">
            <p><strong>Gravida:</strong> {maternityCase.gravida || "—"}</p>
            <p><strong>Parity:</strong> {maternityCase.parity || "—"}</p>
            <p><strong>Gestational Age:</strong> {maternityCase.gestational_age_weeks || "N/A"} weeks</p>
            <p><strong>Risk Level:</strong> {maternityCase.risk_level || "LOW"}</p>
            <p><strong>Last Menstrual Period:</strong> {maternityCase.last_menstrual_period || "N/A"}</p>
            <p><strong>Expected Delivery:</strong> {maternityCase.expected_delivery_date || "N/A"}</p>
            <p><strong>Booking Date:</strong> {maternityCase.booking_date || "N/A"}</p>
            <p><strong>Notes:</strong> {maternityCase.notes || "—"}</p>
            <p><strong>Status:</strong> {maternityCase.status || "active"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block">
              Gravida
              <input
                type="number"
                value={formData.gravida}
                onChange={(e) => setFormData((prev) => ({ ...prev, gravida: e.target.value }))}
                className="w-full border rounded px-3 py-2 mt-1"
              />
            </label>

            <label className="block">
              Parity
              <input
                type="number"
                value={formData.parity}
                onChange={(e) => setFormData((prev) => ({ ...prev, parity: e.target.value }))}
                className="w-full border rounded px-3 py-2 mt-1"
              />
            </label>

            <label className="block">
              Gestational Age (weeks)
              <input
                type="number"
                value={formData.gestational_age_weeks}
                onChange={(e) => setFormData((prev) => ({ ...prev, gestational_age_weeks: e.target.value }))}
                className="w-full border rounded px-3 py-2 mt-1"
              />
            </label>

            <label className="block">
              Risk Level
              <select
                value={formData.risk_level}
                onChange={(e) => setFormData((prev) => ({ ...prev, risk_level: e.target.value }))}
                className="w-full border rounded px-3 py-2 mt-1"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </label>

            <label className="block">
              Last Menstrual Period
              <input
                type="date"
                value={formData.last_menstrual_period}
                onChange={(e) => setFormData((prev) => ({ ...prev, last_menstrual_period: e.target.value }))}
                className="w-full border rounded px-3 py-2 mt-1"
              />
            </label>

            <label className="block">
              Expected Delivery Date
              <input
                type="date"
                value={formData.expected_delivery_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, expected_delivery_date: e.target.value }))}
                className="w-full border rounded px-3 py-2 mt-1"
              />
            </label>

            <label className="block">
              Booking Date
              <input
                type="date"
                value={formData.booking_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, booking_date: e.target.value }))}
                className="w-full border rounded px-3 py-2 mt-1"
              />
            </label>

            <label className="block">
              Notes
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                className="w-full border rounded px-3 py-2 mt-1"
                rows={3}
              />
            </label>

            <button
              onClick={updateCase}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
