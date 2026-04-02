"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function DispensingPage() {
  const [dispensingRecords, setDispensingRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalRevenue, setTotalRevenue] = useState(0)

  useEffect(() => {
    loadDispensingRecords()
  }, [])

  const loadDispensingRecords = async () => {
    try {
      // Get today's dispensing records
      const today = new Date().toISOString().split("T")[0]
      const { data, error } = await supabase
        .from("pharmacy_dispensing")
        .select(
          `
          *,
          prescription_items (
            id,
            prescription_id,
            quantity_prescribed,
            drugs (drug_name, strength)
          ),
          drug_batches (batch_number)
        `
        )
        .gte("dispensed_at", today)
        .order("dispensed_at", { ascending: false })

      if (error) {
        console.error("Failed to load records:", error)
      } else {
        setDispensingRecords(data || [])
        const total = data?.reduce((sum, record) => sum + (record.selling_price_total || 0), 0) || 0
        setTotalRevenue(total)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold mb-4">Dispensing Records</h1>

          {/* Today's Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded border border-blue-200">
              <p className="text-sm text-gray-600">Items Dispensed Today</p>
              <p className="text-2xl font-bold text-blue-600">{dispensingRecords.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded border border-green-200">
              <p className="text-sm text-gray-600">Today's Revenue</p>
              <p className="text-2xl font-bold text-green-600">KES {totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded border border-purple-200">
              <p className="text-sm text-gray-600">Total Profit</p>
              <p className="text-2xl font-bold text-purple-600">
                KES{" "}
                {dispensingRecords
                  .reduce((sum, r) => sum + (r.profit || 0), 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Dispensing List */}
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading records...</div>
        ) : dispensingRecords.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No dispensing records today</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Drug</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Batch</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Qty</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Cost</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Selling Price</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Profit</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {dispensingRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <p className="font-semibold">
                        {record.prescription_items?.drugs?.drug_name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {record.prescription_items?.drugs?.strength}
                      </p>
                    </td>
                    <td className="px-6 py-3 text-sm">{record.drug_batches?.batch_number}</td>
                    <td className="px-6 py-3 text-sm font-semibold">{record.quantity_dispensed}</td>
                    <td className="px-6 py-3 text-sm">KES {record.cost_price_total.toLocaleString()}</td>
                    <td className="px-6 py-3 text-sm">KES {record.selling_price_total.toLocaleString()}</td>
                    <td className="px-6 py-3 text-sm font-semibold text-green-600">
                      KES {record.profit.toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      {new Date(record.dispensed_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
