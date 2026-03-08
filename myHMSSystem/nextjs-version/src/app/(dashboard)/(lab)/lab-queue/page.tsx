"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const supabase = createClient()

export default function LabQueue() {
  const [requests, setRequests] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const { data: labQueue, error } = await supabase
      .from("lab_requests")
      .select(`
        id,
        visit_id,
        status,
        lab_amount,
        payment_status,
        lab_test_master (
          test_name
        )
      `)
      .order("created_at", { ascending: true })

    if (error) {
      console.error(error)
      return
    }

    if (labQueue) {
      setRequests(labQueue)
    }
  }

  const openLab = (labId: string) => {
    router.push(`/labs/${labId}`) // example: navigate to lab details page
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Laboratory Queue</h1>

      {requests.map((req) => (
        <div key={req.id} className="border rounded-xl p-4 flex justify-between items-center">
          
          <div>
            <div className="font-semibold">{req.lab_test_master?.test_name}</div>
            <div className="text-sm text-gray-600">Status: {req.status}</div>
            <div className="text-sm">
              Payment:{" "}
              <span
                className={`ml-2 px-2 py-1 rounded text-white ${
                  req.payment_status === "PAID"
                    ? "bg-green-600"
                    : "bg-red-600"
                }`}
              >
                {req.payment_status}
              </span>
            </div>
            <div className="text-sm text-gray-600">Amount: KES {req.lab_amount}</div>
          </div>

          <div>
            <button
              disabled={req.payment_status === "UNPAID"}
              onClick={() => openLab(req.id)}
              className={`px-4 py-2 rounded-lg text-white ${
                req.payment_status === "UNPAID"
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              Open Lab
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}