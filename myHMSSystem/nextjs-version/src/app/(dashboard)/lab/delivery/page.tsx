"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { jsPDF } from "jspdf"

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
          lab_test_master(*)
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

    // Lab request status already updated when result was approved
    alert("Result released to requesting department")
    loadApprovedResults()
  }

  const generatePDF = async (result: any) => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let yPosition = 20

    // Title
    doc.setFontSize(16)
    doc.text("LIFEPOINT HOSPITAL", pageWidth / 2, yPosition, { align: "center" })
    yPosition += 10
    doc.setFontSize(12)
    doc.text("Laboratory Report", pageWidth / 2, yPosition, { align: "center" })
    yPosition += 15

    // Patient Info
    doc.setFontSize(10)
    doc.setFont(undefined, "bold")
    doc.text("Patient Information", 20, yPosition)
    yPosition += 7
    doc.setFont(undefined, "normal")
    doc.text(
      `Name: ${result.lab_requests.visits?.patient?.first_name} ${result.lab_requests.visits?.patient?.last_name}`,
      20,
      yPosition
    )
    yPosition += 6
    doc.text(`Test: ${result.lab_requests.lab_test_master?.test_name}`, 20, yPosition)
    yPosition += 6
    doc.text(`Date: ${new Date(result.verified_at).toLocaleDateString()}`, 20, yPosition)
    yPosition += 12

    // Results Table
    doc.setFont(undefined, "bold")
    doc.text("Test Results", 20, yPosition)
    yPosition += 8
    doc.setFont(undefined, "normal")

    const results = JSON.parse(result.results || "[]")
    const tableStartY = yPosition

    // Table headers
    doc.setFont(undefined, "bold")
    doc.setFontSize(9)
    doc.text("Parameter", 20, yPosition)
    doc.text("Result", 70, yPosition)
    doc.text("Units", 110, yPosition)
    doc.text("Reference Range", 140, yPosition)
    yPosition += 7
    doc.setDrawColor(0)
    doc.line(20, yPosition, 195, yPosition)
    yPosition += 5

    // Table rows
    doc.setFont(undefined, "normal")
    results.forEach((param: any) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage()
        yPosition = 20
      }
      doc.text(param.parameter, 20, yPosition)
      doc.text(param.result, 70, yPosition)
      doc.text(param.units, 110, yPosition)
      doc.text(param.reference_range || "N/A", 140, yPosition)
      if (param.abnormal) {
        doc.setTextColor(255, 0, 0)
        doc.text("ABNORMAL", 180, yPosition)
        doc.setTextColor(0, 0, 0)
      }
      yPosition += 7
    })

    // Comments
    yPosition += 10
    doc.setFont(undefined, "bold")
    doc.text("Comments:", 20, yPosition)
    yPosition += 6
    doc.setFont(undefined, "normal")
    const comments = result.comments || "None"
    const commentLines = doc.splitTextToSize(comments, 170)
    doc.text(commentLines, 20, yPosition)

    // Footer
    yPosition = pageHeight - 20
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text(`Report ID: ${result.id}`, 20, yPosition)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 130, yPosition)

    // Save PDF
    doc.save(`lab-report-${result.id}.pdf`)
  }

  const sendToDoctor = async (result: any) => {
    // In real implementation, this would send to doctor dashboard or email
    alert("Result sent to requesting department")
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
                      Test: {result.lab_requests.lab_test_master?.test_name}
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