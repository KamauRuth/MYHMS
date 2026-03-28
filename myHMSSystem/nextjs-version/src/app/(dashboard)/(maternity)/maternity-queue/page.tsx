"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function MaternityQueue() {
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const loadCases = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("maternity_cases")
      .select(`
        id,
        status,
        created_at,
        gestational_age_weeks,
        expected_delivery_date,
        risk_level,
        patient:patients (id, first_name, last_name, phone)
      `)
      .order("created_at", { ascending: false })

    setLoading(false)

    if (error) {
      console.error("Failed to load maternity cases", error)
      return
    }

    setCases(data || [])
  }

  useEffect(() => {
    loadCases()
  }, [])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Maternity Queue</h1>
        <button
          onClick={() => router.push("/(maternity)/maternity-new")}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          New Maternity Case
        </button>
      </div>

      <button
        onClick={loadCases}
        className="mb-4 border px-3 py-2 rounded"
      >
        {loading ? "Refreshing..." : "Refresh"}
      </button>

      {cases.length === 0 ? (
        <p className="opacity-60">No maternity cases found.</p>
      ) : (
        <div className="space-y-3">
          {cases.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg p-4 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">
                  {item.patient?.first_name} {item.patient?.last_name}
                </p>
                <p className="text-sm text-gray-500">
                  Gestation: {item.gestational_age_weeks || "N/A"} weeks • Risk: {item.risk_level || "N/A"}
                </p>
                <p className="text-sm">
                  Status: <span className="capitalize">{item.status || "active"}</span>
                </p>
              </div>

              <button
                onClick={() => router.push(`/maternity-case/${item.id}`)}
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
