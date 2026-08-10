"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function DepartmentRequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("pending")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    loadRequests()
  }, [filter])

  const loadRequests = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from("department_stock_requests")
        .select(
          `
          *,
          department_stock_request_items (
            id,
            drug_id,
            quantity_requested,
            quantity_issued,
            status,
            drugs (drug_name, strength)
          )
        `
        )
        .order("request_date", { ascending: false })

      if (filter !== "all") {
        query = query.eq("status", filter)
      }

      const { data, error } = await query

      if (error) {
        console.error("Failed to load requests:", error)
      } else {
        setRequests(data || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const approveRequest = async (requestId: string) => {
    const { error } = await supabase
      .from("department_stock_requests")
      .update({
        status: "approved",
        approval_by: (await supabase.auth.getUser()).data.user?.id,
        approval_date: new Date().toISOString(),
      })
      .eq("id", requestId)

    if (error) {
      alert("Failed to approve request")
    } else {
      alert("Request approved")
      loadRequests()
    }
  }

  const issueRequest = async (requestId: string) => {
    const { error } = await supabase
      .from("department_stock_requests")
      .update({ status: "issued" })
      .eq("id", requestId)

    if (error) {
      alert("Failed to issue request")
    } else {
      alert("Stock issued to department")
      loadRequests()
    }
  }

  const rejectRequest = async (requestId: string) => {
    const reason = prompt("Reason for rejection:")
    if (!reason) return

    const { error } = await supabase
      .from("department_stock_requests")
      .update({
        status: "rejected",
        reason_for_rejection: reason,
      })
      .eq("id", requestId)

    if (error) {
      alert("Failed to reject request")
    } else {
      alert("Request rejected")
      loadRequests()
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: any = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-blue-100 text-blue-800",
      issued: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    }
    return colors[status] || "bg-gray-100"
  }

  const getDepartmentLabel = (dept: string) => {
    const labels: any = {
      opd: "Outpatient Department",
      ipd: "Inpatient Department",
      theatre: "Operating Theatre",
      lab: "Laboratory",
      maternity: "Maternity Ward",
      cwc: "Child Welfare Clinic",
      nursing: "Nursing Unit",
    }
    return labels[dept] || dept.toUpperCase()
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold mb-4">Department Stock Requests</h1>
          <div className="flex gap-2 flex-wrap">
            {["all", "pending", "approved", "issued", "rejected"].map((status) => (
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

        {/* Requests List */}
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No requests found</div>
        ) : (
          <div className="divide-y">
            {requests.map((request) => (
              <div key={request.id} className="p-6 hover:bg-gray-50 transition">
                <div
                  className="cursor-pointer flex justify-between items-start"
                  onClick={() =>
                    setExpandedId(expandedId === request.id ? null : request.id)
                  }
                >
                  <div>
                    <div className="flex gap-2 items-center mb-2">
                      <p className="font-bold text-lg">
                        {getDepartmentLabel(request.requesting_department)}
                      </p>
                      <span
                        className={`text-xs px-2 py-1 rounded font-semibold ${getStatusBadge(request.status)}`}
                      >
                        {request.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Request #: {request.request_number} | Items: {request.department_stock_request_items?.length || 0}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {new Date(request.request_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === request.id && (
                  <div className="mt-4 pt-4 border-t bg-gray-50 p-4 rounded">
                    <h3 className="font-semibold mb-3">Requested Items:</h3>
                    <div className="space-y-2 mb-4">
                      {request.department_stock_request_items?.map((item: any) => (
                        <div key={item.id} className="bg-white p-3 rounded border">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{item.drugs?.drug_name}</p>
                              <p className="text-xs text-gray-600">{item.drugs?.strength}</p>
                              <p className="text-sm text-gray-700 mt-1">
                                Qty Requested: <span className="font-semibold">{item.quantity_requested}</span>
                                {item.quantity_issued > 0 && (
                                  <> | Issued: <span className="font-semibold">{item.quantity_issued}</span></>
                                )}
                              </p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded ${getStatusBadge(item.status)}`}>
                              {item.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {request.reason_for_rejection && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-800">
                          <span className="font-semibold">Rejection Reason:</span> {request.reason_for_rejection}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {request.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveRequest(request.id)}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition font-semibold"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectRequest(request.id)}
                          className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition font-semibold"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {request.status === "approved" && (
                      <button
                        onClick={() => issueRequest(request.id)}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition font-semibold"
                      >
                        Issue Stock to Department
                      </button>
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
