"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

const supabase = createClient()

export default function DentalQueue() {
  const [visits, setVisits] = useState<any[]>([])

  useEffect(() => {
    fetchQueue()
  }, [])

  const fetchQueue = async () => {
    const { data, error } = await supabase
      .from("visits")
      .select(`
        id,
        status,
        created_at,
        patient_id,
        patients(first_name, last_name, phone)
      `)
      .eq("clinic", "DENTAL")
      .order("created_at", { ascending: false })

    if (error) {
      console.error(error)
      return
    }

    setVisits(data || [])
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Dental Queue</h1>

      {visits.length === 0 && <p>No patients in dental queue.</p>}

      {visits.map(v => (
        <div
          key={v.id}
          className="p-4 bg-white rounded-xl shadow flex justify-between items-center"
        >
          <div>
            <p className="font-medium">
              {v.patients?.first_name} {v.patients?.last_name}
            </p>
            <p className="text-sm text-gray-500">
              Phone: {v.patients?.phone}
            </p>
            <p className="text-sm text-gray-500">
              Registered: {new Date(v.created_at).toLocaleString()}
            </p>
            <p className="text-sm">
              Status: <span className="capitalize">{v.status}</span>
            </p>
          </div>

          <Link
            href={`dental-visit/${v.id}`}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Open
          </Link>
        </div>
      ))}
    </div>
  )
}