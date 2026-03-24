"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function ProceduresTab({ visit }) {
  const [procedures, setProcedures] = useState<any[]>([])
  const [selected, setSelected] = useState("")
  const [tooth, setTooth] = useState("")

  useEffect(() => {
    fetchProcedures()
  }, [])

  const fetchProcedures = async () => {
    const { data } = await supabase
      .from("procedure_master")
      .select("*")

    setProcedures(data || [])
  }

  const addProcedure = async () => {
    const proc = procedures.find(p => p.id === selected)

    if (!proc) return

    // 1. Save procedure
    await supabase.from("dental_procedures").insert({
      dental_visit_id: visit.id,
      procedure_id: proc.id,
      tooth_number: tooth,
      status: "done",
      cost: proc.price
    })

    // 2. Send to billing
    await supabase.from("billing_items").insert({
      visit_id: visit.visit_id,
      description: proc.name,
      amount: proc.price,
      quantity: 1
    })

    alert("Procedure added & billed")
  }

  return (
    <div className="space-y-4">

      <select
        onChange={(e) => setSelected(e.target.value)}
        className="border p-2 rounded w-full"
      >
        <option>Select Procedure</option>
        {procedures.map(p => (
          <option key={p.id} value={p.id}>
            {p.name} - {p.price}
          </option>
        ))}
      </select>

      <input
        placeholder="Tooth Number"
        value={tooth}
        onChange={(e) => setTooth(e.target.value)}
        className="border p-2 rounded w-full"
      />

      <button
        onClick={addProcedure}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Add Procedure
      </button>
    </div>
  )
}