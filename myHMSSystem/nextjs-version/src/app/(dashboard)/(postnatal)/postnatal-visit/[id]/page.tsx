"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function PostnatalVisitPage() {
  const { id } = useParams()
  const [visit, setVisit] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [edit, setEdit] = useState(false)
  const [formData, setFormData] = useState({
    days_postpartum: "",
    mode_of_delivery: "",
    vaginal_inspection: "",
    lochia_description: "",
    uterine_firmness: "",
    bp_systolic: "",
    bp_diastolic: "",
    weight: "",
    complications: "",
    notes: "",
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return

    const load = async () => {
      const { data, error } = await supabase
        .from("postnatal_visits")
        .select(`
          *,
          patient:patients (*)
        `)
        .eq("id", id)
        .single()

      if (error) {
        console.error("Failed to load postnatal visit", error)
      } else {
        setVisit(data)
        setFormData({
          days_postpartum: data.days_postpartum || "",
          mode_of_delivery: data.mode_of_delivery || "",
          vaginal_inspection: data.vaginal_inspection || "",
          lochia_description: data.lochia_description || "",
          uterine_firmness: data.uterine_firmness || "",
          bp_systolic: data.bp_systolic || "",
          bp_diastolic: data.bp_diastolic || "",
          weight: data.weight || "",
          complications: data.complications || "",
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
      .from("postnatal_visits")
      .update({
        days_postpartum: Number(formData.days_postpartum) || null,
        mode_of_delivery: formData.mode_of_delivery || "",
        vaginal_inspection: formData.vaginal_inspection || "",
        lochia_description: formData.lochia_description || "",
        uterine_firmness: formData.uterine_firmness || "",
        bp_systolic: formData.bp_systolic || null,
        bp_diastolic: formData.bp_diastolic || null,
        weight: Number(formData.weight) || null,
        complications: formData.complications || "",
        notes: formData.notes || "",
      })
      .eq("id", id)

    setSaving(false)

    if (error) {
      console.error("Failed to update postnatal visit", error)
      alert("Could not update visit")
      return
    }

    alert("Visit updated")
    setEdit(false)

    const { data, error: refreshError } = await supabase
      .from("postnatal_visits")
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
            <h1 className="text-2xl font-bold mb-2">Postnatal Visit</h1>
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
            <p><strong>Days Postpartum:</strong> {visit.days_postpartum || "N/A"}</p>
            <p><strong>Mode of Delivery:</strong> {visit.mode_of_delivery || "N/A"}</p>
            <p><strong>Vaginal Inspection:</strong> {visit.vaginal_inspection || "—"}</p>
            <p><strong>Lochia:</strong> {visit.lochia_description || "—"}</p>
            <p><strong>Uterine Firmness:</strong> {visit.uterine_firmness || "—"}</p>
            <p><strong>BP:</strong> {visit.bp_systolic}/{visit.bp_diastolic} mmHg</p>
            <p><strong>Weight:</strong> {visit.weight || "N/A"} kg</p>
            <p><strong>Complications:</strong> {visit.complications || "—"}</p>
            <p><strong>Notes:</strong> {visit.notes || "—"}</p>
            <p><strong>Status:</strong> {visit.status || "completed"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block">
              Days Postpartum
              <input
                type="number"
                value={formData.days_postpartum}
                onChange={(e) => setFormData((prev) => ({ ...prev, days_postpartum: e.target.value }))}
                className="w-full border rounded px-3 py-2 mt-1"
              />
            </label>

            <label className="block">
              Mode of Delivery
              <input
                type="text"
                value={formData.mode_of_delivery}
                onChange={(e) => setFormData((prev) => ({ ...prev, mode_of_delivery: e.target.value }))}
                className="w-full border rounded px-3 py-2 mt-1"
              />
            </label>

            <label className="block">
              Vaginal Inspection
              <textarea
                value={formData.vaginal_inspection}
                onChange={(e) => setFormData((prev) => ({ ...prev, vaginal_inspection: e.target.value }))}
                className="w-full border rounded px-3 py-2 mt-1"
                rows={2}
              />
            </label>

            <label className="block">
              Lochia Description
              <input
                type="text"
                value={formData.lochia_description}
                onChange={(e) => setFormData((prev) => ({ ...prev, lochia_description: e.target.value }))}
                className="w-full border rounded px-3 py-2 mt-1"
              />
            </label>

            <label className="block">
              Uterine Firmness
              <input
                type="text"
                value={formData.uterine_firmness}
                onChange={(e) => setFormData((prev) => ({ ...prev, uterine_firmness: e.target.value }))}
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
              Complications
              <textarea
                value={formData.complications}
                onChange={(e) => setFormData((prev) => ({ ...prev, complications: e.target.value }))}
                className="w-full border rounded px-3 py-2 mt-1"
                rows={2}
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
