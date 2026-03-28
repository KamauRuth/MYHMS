"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

const supabase = createClient()

export default function TriageQueue() {
  const [visits, setVisits] = useState<any[]>([])

  useEffect(() => {
    fetchQueue()
  }, [])

  const fetchQueue = async () => {
    const { data } = await supabase
      .from("visits")
      .select(`
        id,
        clinic,
        created_at,
        patients(first_name, last_name)
      `)
      .eq("status", "TRIAGE")

    setVisits(data || [])
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Triage Queue</h1>

      {visits.map(v => (
        <div key={v.id} className="border p-4 rounded mb-3 flex justify-between">

          <div>
            <p>{v.patients.first_name} {v.patients.last_name}</p>
            <p className="text-sm text-gray-500">{v.clinic}</p>
          </div>

          <Link
            href={`/triage-form?visitId=${v.id}&clinic=${v.clinic}`}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Triage
          </Link>

        </div>
      ))}
    </div>
  )
}