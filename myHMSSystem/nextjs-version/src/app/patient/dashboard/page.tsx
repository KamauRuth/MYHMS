"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const supabase = createClient()

export default function PatientDashboard() {
  const [patient, setPatient] = useState<any>(null)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const session = localStorage.getItem("patient_session")
    if (!session) {
      router.push("/patient")
      return
    }

    const patientData = JSON.parse(session)
    setPatient(patientData)
    loadResults(patientData.patient_id)
  }, [])

  const loadResults = async (patientId: string) => {
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
          urgency,
          created_at
        )
      `)
      .eq("status", "released")
      .eq("lab_requests.visits.patient_id", patientId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to load results", error)
    } else {
      setResults(data || [])
    }
    setLoading(false)
  }

  const logout = () => {
    localStorage.removeItem("patient_session")
    router.push("/patient")
  }

  const downloadPDF = (result: any) => {
    // Basic PDF generation (placeholder)
    const content = `
LIFEPOINT HOSPITAL - Patient Lab Report

Patient: ${patient.name}
Test: ${result.lab_requests.lab_test_master?.test_name}
Date: ${new Date(result.lab_requests.created_at).toLocaleDateString()}

Results:
${JSON.parse(result.results || "[]").map((param: any) =>
  `${param.parameter}: ${param.result} ${param.units} (${param.reference_range}) ${param.abnormal ? '- ABNORMAL' : ''}`
).join('\n')}

Comments: ${result.comments || 'None'}

Report generated on: ${new Date().toLocaleString()}
    `

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

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  if (!patient) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">LIFEPOINT HOSPITAL</h1>
              <p className="text-gray-600">Patient Portal</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Welcome, {patient.name}</span>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">My Lab Results</h2>

          {results.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">📋</div>
              <p className="text-gray-500">No lab results available yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Results will appear here once they are released by the laboratory
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {results.map(result => (
                <div key={result.id} className="border rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {result.lab_requests.lab_test_master?.test_name}
                      </h3>
                      <p className="text-gray-600">
                        Department: {result.lab_requests.department} |
                        Date: {new Date(result.lab_requests.created_at).toLocaleDateString()} |
                        Urgency: {result.lab_requests.urgency}
                      </p>
                      <p className="text-sm text-gray-500">
                        Released: {new Date(result.released_at || result.verified_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => downloadPDF(result)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Download PDF
                    </button>
                  </div>

                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold mb-3">Test Results</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-2">Parameter</th>
                            <th className="border p-2">Result</th>
                            <th className="border p-2">Units</th>
                            <th className="border p-2">Reference Range</th>
                            <th className="border p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {JSON.parse(result.results || "[]").map((param: any, index: number) => (
                            <tr key={index} className={param.abnormal ? "bg-red-50" : ""}>
                              <td className="border p-2">{param.parameter}</td>
                              <td className="border p-2 font-semibold">{param.result}</td>
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

                  <div className="mt-4 p-3 bg-blue-50 rounded">
                    <p className="text-sm text-blue-800">
                      <strong>Important:</strong> This is an electronic copy of your lab results.
                      Please consult your healthcare provider for interpretation and next steps.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}