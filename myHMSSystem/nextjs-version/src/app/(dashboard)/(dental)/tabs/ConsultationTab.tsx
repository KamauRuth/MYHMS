"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function ConsultationTab({ visit }) {
  const [complaint, setComplaint] = useState(visit.chief_complaint || "")
  const [history, setHistory] = useState(visit.history || "")

  const save = async () => {
    await supabase
      .from("dental_visits")
      .update({
        chief_complaint: complaint,
        history: history
      })
      .eq("id", visit.id)

    alert("Saved")
  }

  return (
    <div className="space-y-4">

      <div>
        <label className="block font-medium">Chief Complaint</label>
        <textarea
          value={complaint}
          onChange={(e) => setComplaint(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      <div>
        <label className="block font-medium">History</label>
        <textarea
          value={history}
          onChange={(e) => setHistory(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      <button
        onClick={save}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Save Consultation
      </button>
    </div>
  )
}