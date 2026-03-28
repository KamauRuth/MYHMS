"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function LabResultDelivery() {
  const [approvedResults, setApprovedResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadApprovedResults()
  }, [])

  const loadApprovedResults = async () => {
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
      .eq("status", "approved")
      .order("verified_at", { ascending: false })

    if (error) {
      console.error("Failed to load approved results", error)
    } else {
      setApprovedResults(data || [])
    }
    setLoading(false)
  }

  const releaseResult = async (resultId: string) => {
    // Update result status to released
    const { error: resultError } = await supabase
      .from("lab_results")
      .update({
        status: "released",
        released_at: new Date().toISOString()
      })
      .eq("id", resultId)

    if (resultError) {
      console.error("Failed to release result", resultError)
      alert("Could not release result")
      return
    }

    // Update request status
    const result = approvedResults.find(r => r.id === resultId)
    if (result) {
      const { error: requestError } = await supabase
        .from("lab_requests")
        .update({ status: "released" })
        .eq("id", result.request_id)

      if (requestError) {
        console.error("Failed to update request status", requestError)
      }
    }

    alert("Result released to requesting department")
    loadApprovedResults()
  }

  const generatePDF = async (result: any) => {
    // Basic PDF generation (in real implementation, use a library like jsPDF or server-side PDF generation)
    const content = `
LIFEPOINT HOSPITAL
Laboratory Report

Patient: ${result.lab_requests.visits?.patient?.first_name} ${result.lab_requests.visits?.patient?.last_name}
Test: ${result.lab_requests.lab_test_master?.test_name}
Date: ${new Date(result.verified_at).toLocaleDateString()}

Results:
${JSON.parse(result.results || "[]").map((param: any) =>
  `${param.parameter}: ${param.result} ${param.units} (${param.reference_range}) ${param.abnormal ? '- ABNORMAL' : ''}`
).join('\n')}

Comments: ${result.comments || 'None'}

Lab Stamp: ____________________
Signature: ____________________
    `

    // Create and download text file (placeholder for PDF)
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lab-report-${result.id}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const sendToDoctor = async (result: any) => {
    // In real implementation, this would send to doctor dashboard or email
    alert(`Result sent to ${result.lab_requests.department} department`)
  }

  if (loading) return <p className="p-6">Loading approved results...</p>

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Result Delivery</h1>
        <p className="text-gray-600 mb-4">Release approved results to requesting departments</p>

        {approvedResults.length === 0 ? (
          <p className="text-gray-500">No approved results ready for release</p>
        ) : (
          <div className="space-y-4">
            {approvedResults.map(result => (
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
                      Approved: {new Date(result.verified_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => generatePDF(result)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Generate PDF
                    </button>
                    <button
                      onClick={() => sendToDoctor(result)}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Send to Doctor
                    </button>
                    <button
                      onClick={() => releaseResult(result.id)}
                      className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                    >
                      Release Result
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-semibold mb-2">Results Preview</h4>
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}