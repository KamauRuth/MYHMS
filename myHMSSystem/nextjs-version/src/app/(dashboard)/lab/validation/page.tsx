"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function LabValidation() {
  const [pendingResults, setPendingResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPendingResults()
  }, [])

  const loadPendingResults = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("lab_results")
      .select(`
        *,
        lab_requests!inner (
          id,
          visits!inner (
            patient:patients(*)
          ),
          lab_test_master(*),
          department,
          urgency
        )
      `)
      .eq("status", "pending_verification")
      .order("entered_at", { ascending: false })

    if (error) {
      console.error("Failed to load pending results", error)
    } else {
      setPendingResults(data || [])
    }
    setLoading(false)
  }

  const approveResult = async (resultId: string) => {
    // Update result status
    const { error: resultError } = await supabase
      .from("lab_results")
      .update({
        status: "approved",
        verified_by: "lab_in_charge", // TODO: get from auth
        verified_at: new Date().toISOString()
      })
      .eq("id", resultId)

    if (resultError) {
      console.error("Failed to approve result", resultError)
      alert("Could not approve result")
      return
    }

    // Update request status
    const result = pendingResults.find(r => r.id === resultId)
    if (result) {
      const { error: requestError } = await supabase
        .from("lab_requests")
        .update({ status: "verified" })
        .eq("id", result.request_id)

      if (requestError) {
        console.error("Failed to update request status", requestError)
      }
    }

    alert("Result approved and ready for release")
    loadPendingResults()
  }

  const rejectResult = async (resultId: string, reason: string) => {
    const { error } = await supabase
      .from("lab_results")
      .update({
        status: "rejected",
        rejection_reason: reason,
        verified_by: "lab_in_charge",
        verified_at: new Date().toISOString()
      })
      .eq("id", resultId)

    if (error) {
      console.error("Failed to reject result", error)
      alert("Could not reject result")
    } else {
      alert("Result rejected")
      loadPendingResults()
    }
  }

  if (loading) return <p className="p-6">Loading pending results...</p>

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Result Validation</h1>
        <p className="text-gray-600 mb-4">Review and approve laboratory results</p>

        {pendingResults.length === 0 ? (
          <p className="text-gray-500">No results pending validation</p>
        ) : (
          <div className="space-y-4">
            {pendingResults.map(result => (
              <div key={result.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold">
                      {result.lab_requests.visits?.patient?.first_name} {result.lab_requests.visits?.patient?.last_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Test: {result.lab_requests.lab_test_master?.test_name} |
                      Department: {result.lab_requests.department} |
                      Urgency: {result.lab_requests.urgency}
                    </p>
                    <p className="text-sm text-gray-500">
                      Entered: {new Date(result.entered_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveResult(result.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt("Rejection reason:")
                        if (reason) rejectResult(result.id, reason)
                      }}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-semibold mb-2">Results</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-2">Parameter</th>
                          <th className="border p-2">Result</th>
                          <th className="border p-2">Units</th>
                          <th className="border p-2">Reference</th>
                          <th className="border p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {JSON.parse(result.results || "[]").map((param: any, index: number) => (
                          <tr key={index} className={param.abnormal ? "bg-red-50" : ""}>
                            <td className="border p-2">{param.parameter}</td>
                            <td className="border p-2">{param.result}</td>
                            <td className="border p-2">{param.units}</td>
                            <td className="border p-2">{param.reference_range}</td>
                            <td className="border p-2">
                              {param.abnormal ? (
                                <span className="text-red-600 font-semibold">Abnormal</span>
                              ) : (
                                <span className="text-green-600">Normal</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {result.comments && (
                    <div className="mt-4">
                      <strong>Comments:</strong> {result.comments}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}