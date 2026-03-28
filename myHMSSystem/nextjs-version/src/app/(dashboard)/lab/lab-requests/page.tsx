"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function LabRequests() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all") // all, pending, in_process, completed, verified, released

  useEffect(() => {
    loadRequests()
  }, [filter])

  const loadRequests = async () => {
    setLoading(true)
    let query = supabase
      .from("lab_requests")
      .select(`
        *,
        visits!inner (
          patient:patients(*)
        ),
        lab_test_master(*)
      `)
      .order("created_at", { ascending: false })

    if (filter !== "all") {
      query = query.eq("status", filter)
    }

    const { data, error } = await query

    if (error) {
      console.error("Failed to load requests", error)
    } else {
      setRequests(data || [])
    }
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("lab_requests")
      .update({ status })
      .eq("id", id)

    if (error) {
      console.error("Failed to update status", error)
    } else {
      loadRequests()
    }
  }

  const statusOptions = ["pending", "in_process", "completed", "verified", "released"]

  if (loading) return <p className="p-6">Loading requests...</p>

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Lab Test Requests</h1>

        <div className="mb-4">
          <label className="mr-4">Filter by Status:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="in_process">In Process</option>
            <option value="completed">Completed</option>
            <option value="verified">Verified</option>
            <option value="released">Released</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Request ID</th>
                <th className="border p-2">Patient</th>
                <th className="border p-2">Test</th>
                <th className="border p-2">Department</th>
                <th className="border p-2">Urgency</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(request => (
                <tr key={request.id}>
                  <td className="border p-2">{request.id}</td>
                  <td className="border p-2">
                    {request.visits?.patient?.first_name} {request.visits?.patient?.last_name}
                  </td>
                  <td className="border p-2">{request.lab_test_master?.test_name}</td>
                  <td className="border p-2">{request.department}</td>
                  <td className="border p-2">{request.urgency}</td>
                  <td className="border p-2">
                    <select
                      value={request.status}
                      onChange={(e) => updateStatus(request.id, e.target.value)}
                      className="border rounded px-2 py-1"
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td className="border p-2">
                    <button
                      onClick={() => window.location.href = `/lab/samples?requestId=${request.id}`}
                      className="bg-blue-600 text-white px-2 py-1 rounded text-sm mr-2"
                    >
                      Manage Sample
                    </button>
                    <button
                      onClick={() => window.location.href = `/lab/results?requestId=${request.id}`}
                      className="bg-green-600 text-white px-2 py-1 rounded text-sm"
                    >
                      Enter Results
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}