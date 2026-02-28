"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

const statusLabel = (s: string) => {
  if (s === "WAITING_DOCTOR") return "Waiting Doctor"
  if (s === "IN_PROGRESS") return "In Progress"
  if (s === "WAITING_LAB_RESULTS") return "Waiting Lab"
  if (s === "COMPLETED") return "Completed"
  return s || "—"
}

export default function OPDQueue() {
  const [queue, setQueue] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  const fetchQueue = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("visits")
        .select(`
          id,
          status,
          created_at,
          patients (
            first_name,
            last_name
          )
        `)
        .in("status", [
          "WAITING_DOCTOR",
          "IN_PROGRESS",
          "WAITING_LAB_RESULTS"
        ])
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Queue load error:", error)
        return
      }

      setQueue(data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQueue()

    const interval = setInterval(fetchQueue, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        OPD — Doctor Worklist
      </h1>

      <button
        onClick={fetchQueue}
        className="mb-4 border px-4 py-2 rounded"
      >
        {loading ? "Refreshing..." : "Refresh"}
      </button>

      {queue.length === 0 && (
        <p className="opacity-60">
          No patients in OPD queue
        </p>
      )}

      <div className="space-y-3">
        {queue.map((v) => (
          <div
            key={v.id}
            className="border rounded-lg p-4 flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">
                {v.patients?.first_name}{" "}
                {v.patients?.last_name}
              </p>

              <span className="text-xs border px-2 py-1 rounded-full">
                {statusLabel(v.status)}
              </span>
            </div>

            <button
              onClick={() =>
                router.push(`/opd-visit?visitId=${v.id}`)
              }
              className="bg-black text-white px-4 py-2 rounded"
            >
              Open
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}