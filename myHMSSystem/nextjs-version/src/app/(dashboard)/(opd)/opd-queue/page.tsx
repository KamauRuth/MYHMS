"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { PAYMENT_STATUS, VISIT_STATUS } from "@/lib/workflows/encounters"

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
  const [openingVisitId, setOpeningVisitId] = useState<string | null>(null)

  const router = useRouter()

  const fetchQueue = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("visits")
        .select(`
          id,
          status,
          payment_status,
          created_at,
          patients (
            first_name,
            last_name
          )
        `)
        .in("status", [
          VISIT_STATUS.WAITING_DOCTOR,
          VISIT_STATUS.IN_PROGRESS,
          VISIT_STATUS.WAITING_LAB_RESULTS
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

  const openVisit = async (visit: any) => {
    if (visit.payment_status !== PAYMENT_STATUS.PAID) return

    try {
      setOpeningVisitId(visit.id)

      if (visit.status === VISIT_STATUS.WAITING_DOCTOR) {
        const { error } = await supabase
          .from("visits")
          .update({ status: VISIT_STATUS.IN_PROGRESS })
          .eq("id", visit.id)
          .eq("status", VISIT_STATUS.WAITING_DOCTOR)

        if (error) throw error
        setQueue((current) => current.map((item) =>
          item.id === visit.id ? { ...item, status: VISIT_STATUS.IN_PROGRESS } : item
        ))
      }

      router.push(`/opd-visit?visitId=${visit.id}`)
    } catch (error: any) {
      alert(`Unable to open consultation: ${error.message}`)
    } finally {
      setOpeningVisitId(null)
    }
  }

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
              {v.payment_status !== PAYMENT_STATUS.PAID && (
                <p className="mt-2 text-xs font-medium text-amber-700">Payment clearance required</p>
              )}
            </div>

            <button
              disabled={v.payment_status !== PAYMENT_STATUS.PAID || openingVisitId === v.id}
              onClick={() => openVisit(v)}
              className="bg-black text-white px-4 py-2 rounded disabled:cursor-not-allowed disabled:opacity-40"
            >
              {openingVisitId === v.id ? "Opening..." : v.status === VISIT_STATUS.WAITING_DOCTOR ? "Start consultation" : "Open"}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
