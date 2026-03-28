"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function PostnatalQueue() {
  const [visits, setVisits] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const loadQueue = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("postnatal_visits")
      .select(`
        id,
        visit_number,
        status,
        days_postpartum,
        created_at,
        patient:patients (id, first_name, last_name, phone)
      `)
      .order("created_at", { ascending: false })

    setLoading(false)

    if (error) {
      console.error("Failed to load postnatal visits", error)
      return
    }

    setVisits(data || [])
  }

  useEffect(() => {
    loadQueue()
  }, [])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Postnatal Clinic Queue</h1>
        <button
          onClick={() => router.push("/postnatal-new")}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          New Postnatal Visit
        </button>
      </div>

      <button
        onClick={loadQueue}
        className="mb-4 border px-3 py-2 rounded"
      >
        {loading ? "Refreshing..." : "Refresh"}
      </button>

      {visits.length === 0 ? (
        <p className="opacity-60">No postnatal visits found.</p>
      ) : (
        <div className="space-y-3">
          {visits.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg p-4 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">
                  {item.patient?.first_name} {item.patient?.last_name}
                </p>
                <p className="text-sm text-gray-500">
                  Visit {item.visit_number || "#"} • {item.days_postpartum || "?"} days postpartum
                </p>
                <p className="text-sm">
                  Status: <span className="capitalize">{item.status || "pending"}</span>
                </p>
              </div>

              <button
                onClick={() => router.push(`/postnatal-visit/${item.id}`)}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Open
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
