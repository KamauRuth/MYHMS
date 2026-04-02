"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    loadPrescriptions()
  }, [filter])

  const loadPrescriptions = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from("prescriptions")
        .select(
          `
          *,
          patients!inner (id, first_name, last_name, patient_number),
          prescription_items (
            id,
            drug_id,
            quantity_prescribed,
            quantity_dispensed,
            frequency,
            route,
            status,
            drugs (id, drug_name, generic_name, strength)
          )
        `
        )
        .order("prescribed_at", { ascending: false })

      // Apply filter
      if (filter !== "all") {
        query = query.eq("status", filter)
      }

      const { data, error } = await query

      if (error) {
        console.error("Failed to load prescriptions:", error)
      } else {
        setPrescriptions(data || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const getDepartmentBadgeColor = (dept: string) => {
    const colors: any = {
      opd: "bg-blue-100 text-blue-800",
      ipd: "bg-green-100 text-green-800",
      theatre: "bg-purple-100 text-purple-800",
      lab: "bg-orange-100 text-orange-800",
      maternity: "bg-pink-100 text-pink-800",
      cwc: "bg-yellow-100 text-yellow-800",
      emergency: "bg-red-100 text-red-800",
    }
    return colors[dept] || "bg-gray-100 text-gray-800"
  }

  const getStatusBadge = (status: string) => {
    const colors: any = {
      pending: "bg-yellow-100 text-yellow-800",
      dispensed: "bg-green-100 text-green-800",
      partial: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800",
      expired: "bg-gray-100 text-gray-800",
    }
    return `px-3 py-1 rounded-full text-xs font-semibold ${colors[status] || "bg-gray-100"}`
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold mb-4">Prescription Queue</h1>
          <div className="flex gap-2 flex-wrap">
            {["all", "pending", "partial", "dispensed", "cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded transition ${
                  filter === status
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Prescriptions List */}
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading prescriptions...</div>
        ) : prescriptions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No prescriptions found</div>
        ) : (
          <div className="divide-y">
            {prescriptions.map((prescription) => (
              <div key={prescription.id} className="p-6 hover:bg-gray-50 transition">
                {/* Prescription Header */}
                <div
                  className="cursor-pointer"
                  onClick={() =>
                    setExpandedId(expandedId === prescription.id ? null : prescription.id)
                  }
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex gap-2 items-center mb-2">
                        <p className="font-bold text-lg">
                          Rx: {prescription.patients?.first_name} {prescription.patients?.last_name}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded ${getStatusBadge(prescription.status)}`}>
                          {prescription.status.toUpperCase()}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${getDepartmentBadgeColor(prescription.department)}`}
                        >
                          {prescription.department.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Rx #: {prescription.prescription_number} | Patient: {prescription.patients?.patient_number}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {new Date(prescription.prescribed_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {prescription.prescription_items?.length || 0} items
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === prescription.id && (
                  <div className="mt-4 pt-4 border-t bg-gray-50 p-4 rounded">
                    <h3 className="font-semibold mb-3">Prescribed Medications:</h3>
                    <div className="space-y-2">
                      {prescription.prescription_items?.map((item: any) => (
                        <div
                          key={item.id}
                          className="bg-white p-3 rounded border flex justify-between items-start"
                        >
                          <div>
                            <p className="font-semibold">
                              {item.drugs?.drug_name} ({item.drugs?.strength})
                            </p>
                            <p className="text-xs text-gray-600">Generic: {item.drugs?.generic_name}</p>
                            <p className="text-sm text-gray-700 mt-1">
                              <span className="font-semibold">Qty:</span> {item.quantity_prescribed}
                              {item.quantity_dispensed > 0 ? ` | Dispensed: ${item.quantity_dispensed}` : ""}
                            </p>
                            <p className="text-xs text-gray-600">
                              <span className="font-semibold">Frequency:</span> {item.frequency || "As directed"} |{" "}
                              <span className="font-semibold">Route:</span> {item.route || "Oral"}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded whitespace-nowrap ${getStatusBadge(item.status)}`}
                          >
                            {item.status.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    {prescription.status === "pending" && (
                      <div className="mt-4 flex gap-2">
                        <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition font-semibold">
                          Dispense
                        </button>
                        <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition font-semibold">
                          Partial Dispense
                        </button>
                        <button className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition font-semibold">
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
