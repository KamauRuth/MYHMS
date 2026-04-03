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

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    const { data } = await supabase
      .from("odontogram_records")
      .select("*")
      .eq("dental_visit_id", visitId)

    setRecords(data || [])
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
    if (!selectedTooth) return

    await supabase.from("odontogram_records").insert({
      dental_visit_id: visitId,
      tooth_number: selectedTooth.toString(),
      condition,
      status: "existing"
    })

    setSelectedTooth(null)
    fetchRecords()
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