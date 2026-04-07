"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

const supabase = createClient()

interface Visit {
  id: string
  clinic: string
  created_at: string
  patients: {
    first_name: string
    last_name: string
  }
  paymentApproved?: boolean
  balance?: number
}

export default function TriageQueue() {
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQueue()
  }, [])

  const fetchQueue = async () => {
    try {
      const { data } = await supabase
        .from("visits")
        .select(`
          id,
          clinic,
          created_at,
          patient_id,
          patients(first_name, last_name)
        `)
        .eq("status", "TRIAGE")

      if (data) {
        // Fetch payment details for each visit
        const visitsWithPayment = await Promise.all(
          data.map(async (visit) => {
            // Get invoices for this visit's patient
            const { data: invoices } = await supabase
              .from("invoices")
              .select("balance, status")
              .eq("patient_id", visit.patient_id)
              .order("created_at", { ascending: false })
              .limit(1)

            // Payment is approved if there's no outstanding balance
            const paymentApproved = invoices && invoices.length > 0 
              ? invoices[0].balance === 0 || invoices[0].balance === null
              : true // If no invoice, allow to proceed

            return {
              ...visit,
              paymentApproved,
              balance: invoices?.[0]?.balance || 0
            }
          })
        )

        setVisits(visitsWithPayment)
      }
    } catch (error) {
      console.error("Error fetching queue:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold mb-4">Triage Queue</h1>
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Triage Queue</h1>

      {visits.length === 0 ? (
        <p className="text-gray-500">No patients in triage queue</p>
      ) : (
        visits.map(v => (
          <div key={v.id} className="border p-4 rounded mb-3 flex justify-between items-center bg-white hover:shadow-lg transition">

            <div className="flex-1">
              <p className="font-medium">{v.patients.first_name} {v.patients.last_name}</p>
              <p className="text-sm text-gray-500">{v.clinic}</p>
              {v.balance > 0 && (
                <p className="text-sm text-red-600 font-medium mt-1">
                  ⚠️ Outstanding balance: KES {v.balance.toLocaleString()}
                </p>
              )}
              {v.paymentApproved && (
                <p className="text-sm text-green-600 font-medium mt-1">
                  ✅ Payment approved
                </p>
              )}
            </div>

            {v.paymentApproved ? (
              <Link
                href={`/triage-form?visitId=${v.id}&clinic=${v.clinic}`}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition font-medium"
              >
                Proceed to Triage
              </Link>
            ) : (
              <button
                disabled
                className="bg-gray-400 text-white px-4 py-2 rounded cursor-not-allowed font-medium"
                title="Payment must be approved before proceeding"
              >
                Awaiting Payment
              </button>
            )}

          </div>
        ))
      )}
    </div>
  )
}