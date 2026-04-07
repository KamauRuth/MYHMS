"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

const upperTeeth = Array.from({ length: 16 }, (_, i) => i + 1)
const lowerTeeth = Array.from({ length: 16 }, (_, i) => i + 17)

export default function OdontogramTab({ visitId }: { visitId: any }) {
  const [records, setRecords] = useState<any[]>([])
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)
  const [condition, setCondition] = useState("caries")
  const [dentalVisitId, setDentalVisitId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeDentalVisit()
  }, [visitId])

  const initializeDentalVisit = async () => {
    try {
      // Check if dental_visit exists
      const { data: existing, error: existingError } = await supabase
        .from("dental_visits")
        .select("id")
        .eq("id", visitId)
        .single()

      if (!existingError && existing) {
        // Dental visit exists, use it
        setDentalVisitId(existing.id)
        fetchRecords(existing.id)
        return
      }

      // Dental visit doesn't exist, create it
      const { data: newVisit, error: createError } = await supabase
        .from("dental_visits")
        .insert({
          id: visitId, // Use the provided ID
          status: "in-chair" // Use valid status from database check constraint
        })
        .select()
        .single()

      if (createError) {
        console.error("Error creating dental visit:", createError)
        setLoading(false)
        return
      }

      setDentalVisitId(newVisit.id)
      fetchRecords(newVisit.id)
    } catch (err) {
      console.error("Error initializing dental visit:", err)
      setLoading(false)
    }
  }

  const fetchRecords = async (dvId: string) => {
    const { data } = await supabase
      .from("odontogram_records")
      .select("*")
      .eq("dental_visit_id", dvId)

    setRecords(data || [])
    setLoading(false)
  }

  const getCondition = (tooth: number) => {
    return records.find(r => r.tooth_number == tooth)?.condition
  }

  const getColor = (condition: string) => {
    switch (condition) {
      case "caries": return "bg-red-500"
      case "filling": return "bg-blue-500"
      case "missing": return "bg-black"
      case "planned": return "bg-yellow-400"
      default: return "bg-gray-200"
    }
  }

  const saveCondition = async () => {
    if (!selectedTooth || !dentalVisitId) return

    try {
      await supabase.from("odontogram_records").insert({
        dental_visit_id: dentalVisitId,
        tooth_number: selectedTooth.toString(),
        condition,
        status: "existing"
      })

      setSelectedTooth(null)
      fetchRecords(dentalVisitId)
      alert("Tooth condition saved")
    } catch (err) {
      console.error("Error saving condition:", err)
      alert("Failed to save condition")
    }
  }

  const Tooth = ({ number }: { number: number }) => (
    <button
      onClick={() => setSelectedTooth(number)}
      className={`w-12 h-12 rounded flex items-center justify-center text-white text-sm
        ${getColor(getCondition(number))}`}
    >
      {number}
    </button>
  )

  if (loading) return <p>Loading odontogram...</p>

  return (
    <div className="space-y-6">

      {/* Upper Jaw */}
      <div>
        <p className="mb-2 text-sm text-gray-500">Upper Jaw</p>
        <div className="flex gap-2 flex-wrap">
          {upperTeeth.map(t => <Tooth key={t} number={t} />)}
        </div>
      </div>

      {/* Lower Jaw */}
      <div>
        <p className="mb-2 text-sm text-gray-500">Lower Jaw</p>
        <div className="flex gap-2 flex-wrap">
          {lowerTeeth.map(t => <Tooth key={t} number={t} />)}
        </div>
      </div>

      {/* Action Panel */}
      {selectedTooth && (
        <div className="p-4 bg-white shadow rounded-xl space-y-3">
          <p>
            Tooth: <strong>{selectedTooth}</strong>
          </p>

          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="caries">Caries</option>
            <option value="filling">Filling</option>
            <option value="missing">Missing</option>
            <option value="planned">Planned</option>
          </select>

          <button
            onClick={saveCondition}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </div>
      )}
    </div>
  )
}