"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { LabResultTemplate } from "@/components/lab/LabResultTemplate"

const supabase = createClient()

export default function PatientDashboard() {
  const [patient, setPatient] = useState<any>(null)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const parseResults = (value: string | null | undefined) => {
    try {
      const parsed = JSON.parse(value || "[]")
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const buildPrintableReport = (result: any) => {
    const reportResults = parseResults(result.results)
    const abnormal = reportResults.some((item: any) => item.abnormal)
    const reportTitle = result.lab_requests.lab_test_master?.test_name || "Laboratory Report"
    const reportDate = new Date(result.released_at || result.verified_at || new Date()).toLocaleString()

    const rows = reportResults
      .map(
        (item: any) => `
          <tr>
            <td>${item.parameter || ""}</td>
            <td>${item.result || ""} ${item.units || ""}</td>
            <td>${item.reference_range || "—"}</td>
            <td>${item.abnormal ? "Abnormal" : "Normal"}</td>
          </tr>
        `
      )
      .join("")

    const summary = result.comments || (abnormal ? "Some values are outside the normal range and should be reviewed." : "All results are within normal limits.")

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${reportTitle}</title>
          <style>
            body {
              margin: 0;
              font-family: Arial, Helvetica, sans-serif;
              background: #f4f7fb;
              color: #0f172a;
            }
            .page {
              max-width: 900px;
              margin: 24px auto;
              background: #fff;
              border: 1px solid #dbe3ee;
              border-radius: 18px;
              overflow: hidden;
              box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
            }
            .header {
              background: linear-gradient(135deg, #020617, #1e293b);
              color: white;
              padding: 28px;
              display: flex;
              justify-content: space-between;
              gap: 20px;
              flex-wrap: wrap;
            }
            .header h1, .header p {
              margin: 0;
            }
            .meta {
              text-align: right;
              font-size: 14px;
              opacity: 0.92;
            }
            .section {
              padding: 24px 28px;
              border-bottom: 1px solid #e2e8f0;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 14px;
            }
            .card {
              border: 1px solid #dbe3ee;
              background: #f8fafc;
              border-radius: 14px;
              padding: 14px;
            }
            .label {
              font-size: 11px;
              letter-spacing: 0.2em;
              text-transform: uppercase;
              color: #64748b;
              margin-bottom: 6px;
            }
            .value {
              font-weight: 700;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 14px;
            }
            th, td {
              padding: 12px 10px;
              border-bottom: 1px solid #e2e8f0;
              text-align: left;
              vertical-align: top;
            }
            th {
              background: #f1f5f9;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: #334155;
            }
            .pill {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 999px;
              font-size: 12px;
              font-weight: 700;
            }
            .pill.normal { background: #dcfce7; color: #166534; }
            .pill.abnormal { background: #fee2e2; color: #b91c1c; }
            .impression {
              background: #fff7ed;
              border: 1px solid #fed7aa;
              color: #9a3412;
              border-radius: 14px;
              padding: 16px;
              line-height: 1.6;
            }
            .footer {
              padding: 18px 28px 28px;
              color: #64748b;
              font-size: 12px;
            }
            @media print {
              body { background: white; }
              .page { margin: 0; border: 0; border-radius: 0; box-shadow: none; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="padding: 16px 24px; text-align: right;">
            <button onclick="window.print()" style="padding: 10px 16px; border: 0; border-radius: 10px; background: #0f172a; color: white; font-weight: 700; cursor: pointer;">Print</button>
          </div>
          <div class="page">
            <div class="header">
              <div>
                <p style="font-size: 11px; letter-spacing: 0.35em; text-transform: uppercase; color: #cbd5e1;">Medical Laboratory Report</p>
                <h1 style="font-size: 28px; margin-top: 8px;">LIFEPOINT HOSPITAL</h1>
                <p style="margin-top: 6px; color: #cbd5e1;">123 Wellness Blvd, Suite 456, New York, NY 10001</p>
                <p style="color: #cbd5e1;">Tel: (555) 987-6543</p>
              </div>
              <div class="meta">
                <div style="font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase; color: #cbd5e1;">Report Reference</div>
                <div style="margin-top: 6px; font-weight: 700;">${result.id}</div>
                <div style="margin-top: 4px; color: #cbd5e1;">Report date: ${reportDate}</div>
              </div>
            </div>
            <div class="section">
              <div class="grid">
                <div class="card"><div class="label">Patient</div><div class="value">${patient?.name || "—"}</div></div>
                <div class="card"><div class="label">Patient Number</div><div class="value">${patient?.patient_id || "—"}</div></div>
                <div class="card"><div class="label">Test</div><div class="value">${reportTitle}</div></div>
                <div class="card"><div class="label">Request Date</div><div class="value">${new Date(result.lab_requests.created_at).toLocaleString()}</div></div>
              </div>
            </div>
            <div class="section">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;">
                <div>
                  <div class="label" style="margin-bottom:4px;">Laboratory Results</div>
                  <div style="font-size:18px;font-weight:700;">${reportTitle}</div>
                </div>
                <span class="pill ${abnormal ? "abnormal" : "normal"}">${abnormal ? "Review Required" : "Within Normal Limits"}</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Result</th>
                    <th>Normal Range</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows || `<tr><td colspan="4">No result values were recorded.</td></tr>`}
                </tbody>
              </table>
            </div>
            <div class="section" style="border-bottom: 0;">
              <div class="grid">
                <div class="impression">
                  <div class="label" style="color:#9a3412;">General Impression</div>
                  ${summary}
                </div>
                <div class="card">
                  <div class="label">Report Details</div>
                  <div class="value" style="font-weight: 600;">Released: ${new Date(result.released_at || result.verified_at).toLocaleString()}</div>
                  <div style="margin-top: 8px; color: #475569;">This is an electronic copy of the laboratory report.</div>
                </div>
              </div>
            </div>
            <div class="footer">
              The isolated analysis of this exam has no diagnostic value unless evaluated in conjunction with clinical and complementary exam data.
            </div>
          </div>
        </body>
      </html>
    `
  }

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
            patient_id,
            patients(*)
          ),
          lab_test_master(*),
          created_at
        )
      `)
      .eq("status", "released")
      .filter("lab_requests.visits.patient_id", "eq", patientId)
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

  const printReport = (result: any) => {
    const popup = window.open("", "_blank", "noopener,noreferrer,width=1200,height=900")
    if (!popup) {
      alert("Please allow popups to view the report.")
      return
    }

    popup.document.write(buildPrintableReport(result))
    popup.document.close()
    popup.focus()
    popup.onload = () => popup.print()
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
                <div key={result.id} className="border rounded-2xl p-4 md:p-6 shadow-sm bg-white">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {result.lab_requests.lab_test_master?.test_name}
                      </h3>
                      <p className="text-gray-600">

                        Date: {new Date(result.lab_requests.created_at).toLocaleDateString()} |
                        Test: {result.lab_requests.lab_test_master.test_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Released: {new Date(result.released_at || result.verified_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => printReport(result)}
                      className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800"
                    >
                      Print Report
                    </button>
                  </div>

                  <LabResultTemplate
                    patientName={patient?.name || "—"}
                    patientNumber={patient?.patient_id || null}
                    requestId={result.lab_requests?.id || result.id}
                    testName={result.lab_requests.lab_test_master?.test_name}
                    clinicName={result.lab_requests?.clinic_name || "Health First Clinic"}
                    requestingDoctor={result.lab_requests?.requesting_doctor || "—"}
                    collectionDate={result.lab_requests?.collection_date || result.lab_requests?.created_at}
                    receivedDate={result.lab_requests?.received_date || result.lab_requests?.created_at}
                    reportDate={result.released_at || result.verified_at}
                    releasedDate={result.released_at || result.verified_at}
                    results={parseResults(result.results)}
                    comments={result.comments}
                  />

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