"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const supabase = createClient()

export default function TriageQueue() {
  const [queue, setQueue] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    loadQueue()
  }, [])

  const loadQueue = async () => {
    const { data, error } = await supabase
      .from("visits")
      .select(`
        id,
        created_at,
        patients (
          first_name,
          last_name
        )
      `)
      .eq("status", "TRIAGE")
      .eq("triage_status", "pending")
      .order("created_at", { ascending: true })

    if (!error && data) {
      setQueue(data)
    }
  }

  // 🔹 Open Triage Form
  const handleOpen = async (visitId: string) => {
    // Lock visit so others can't open
    await supabase
      .from("visits")
      .update({ triage_status: "in_progress" })
      .eq("id", visitId)
      .eq("triage_status", "pending")

    // Redirect with query param
    router.push(`/triage-form?visitId=${visitId}`)
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Triage Queue</h1>

      {queue.length === 0 ? (
        <p>No patients in triage queue</p>
      ) : (
        <ul>
          {queue.map((visit) => (
            <li
              key={visit.id}
              className="border p-3 mb-3 rounded flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">
                  {visit.patients.first_name} {visit.patients.last_name}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(visit.created_at).toLocaleString()}
                </p>
              </div>

              <button
                onClick={() => handleOpen(visit.id)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Open
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}