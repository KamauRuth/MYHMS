"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function ANCVisitPage() {
  const { id } = useParams()
  const [visit, setVisit] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [edit, setEdit] = useState(false)
  const [formData, setFormData] = useState({
    gestational_age_weeks: "",
    bp_systolic: "",
    bp_diastolic: "",
    weight: "",
    urine_protein: "",
    notes: "",
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return

    const load = async () => {
      const { data, error } = await supabase
        .from("anc_visits")
        .select(`
          *,
          patient:patients (*)
        `)
        .eq("id", id)
        .single()

      if (error) {
        console.error("Failed to load ANC visit", error)
      } else {
        setVisit(data)
        setFormData({
          gestational_age_weeks: data.gestational_age_weeks || "",
          bp_systolic: data.bp_systolic || "",
          bp_diastolic: data.bp_diastolic || "",
          weight: data.weight || "",
          urine_protein: data.urine_protein || "",
          notes: data.notes || "",
        })
      }

      setLoading(false)
    }

    load()
  }, [id])

  const updateVisit = async () => {
    if (!id) return

    setSaving(true)

    const { error } = await supabase
      .from("anc_visits")
      .update({
        gestational_age_weeks: Number(formData.gestational_age_weeks) || null,
        bp_systolic: formData.bp_systolic || null,
        bp_diastolic: formData.bp_diastolic || null,
        weight: Number(formData.weight) || null,
        urine_protein: formData.urine_protein || "",
        notes: formData.notes || "",
      })
      .eq("id", id)

    setSaving(false)

    if (error) {
      console.error("Failed to update ANC visit", error)
      alert("Could not update visit")
      return
    }

    alert("Visit updated")
    setEdit(false)

    const { data, error: refreshError } = await supabase
      .from("anc_visits")
      .select(`
        *,
        patient:patients (*)
      `)
      .eq("id", id)
      .single()

    if (!refreshError) {
      setVisit(data)
    }
  }

  if (loading) return <p className="p-6">Loading visit...</p>
  if (!visit) return <p className="p-6">Visit not found.</p>

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">ANC Visit</h1>
            <p className="text-lg">
              {visit.patient?.first_name} {visit.patient?.last_name}
            </p>
            <p className="text-sm text-gray-500">
              Visit #{visit.visit_number} • {new Date(visit.created_at).toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => setEdit(!edit)}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            {edit ? "Cancel" : "Edit"}
          </button>
        </div>

        {!edit ? (
          <div className="space-y-2">
            <p><strong>Gestational Age:</strong> {visit.gestational_age_weeks || "N/A"} weeks</p>
            <p><strong>BP:</strong> {visit.bp_systolic}/{visit.bp_diastolic} mmHg</p>
            <p><strong>Weight:</strong> {visit.weight || "N/A"} kg</p>
            <p><strong>Urine Protein:</strong> {visit.urine_protein || "—"}</p>
            <p><strong>Notes:</strong> {visit.notes || "—"}</p>
            <p><strong>Status:</strong> {visit.status || "completed"}</p>
          </div>
        ) : (
          <div className="space-y-3">
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
              BP Systolic
              <input
                type="number"
                value={formData.bp_systolic}
                onChange={(e) => setFormData((prev) => ({ ...prev, bp_systolic: e.target.value }))}
                className="w-full border rounded px-3 py-2 mt-1"
              />
            </label>

            <label className="block">
              BP Diastolic
              <input
                type="number"
                value={formData.bp_diastolic}
                onChange={(e) => setFormData((prev) => ({ ...prev, bp_diastolic: e.target.value }))}
                className="w-full border rounded px-3 py-2 mt-1"
              />
            </label>

            <label className="block">
              Weight (kg)
              <input
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData((prev) => ({ ...prev, weight: e.target.value }))}
                className="w-full border rounded px-3 py-2 mt-1"
              />
            </label>

            <label className="block">
              Urine Protein
              <input
                type="text"
                value={formData.urine_protein}
                onChange={(e) => setFormData((prev) => ({ ...prev, urine_protein: e.target.value }))}
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
              onClick={updateVisit}
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
