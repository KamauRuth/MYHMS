"use client"

import { Fragment, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LabResultTemplate } from "@/components/lab/LabResultTemplate"
import { calculateAbnormal, calculateResultStatus, getClinicalTemplate, type LabTemplateParameter } from "@/lib/lab/resultTemplates"

const supabase = createClient()

type ResultRow = {
  parameter: string
  result: string
  units?: string | null
  reference_range?: string | null
  abnormal?: boolean | null
  section?: string
  input_type?: "number" | "text" | "select"
  options?: string[]
  min?: number
  max?: number
  decimals?: number
}

const parseJsonArray = (value: any) => {
  if (!value) return []

  if (Array.isArray(value)) return value

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const buildInitialRows = (templateParameters: any, existingRows?: any[]) => {
  const rows = parseJsonArray(templateParameters).map((param: any) => ({
    parameter: param.parameter || param.name || "Unnamed Parameter",
    result: "",
    units: param.units || "",
    reference_range: param.reference_range || param.normal_range || "",
    abnormal: false,
    section: param.section || "Results",
    input_type: param.input_type || param.type || "text",
    options: param.options || [],
    min: param.min,
    max: param.max,
    decimals: param.decimals,
  }))

  if (!existingRows || existingRows.length === 0) {
    return rows
  }

  return rows.map((row: ResultRow) => {
    const existing = existingRows.find((item: any) => item.parameter === row.parameter)
    return existing
      ? {
          ...row,
          result: existing.result ?? row.result,
          units: existing.units ?? row.units,
          reference_range: existing.reference_range ?? row.reference_range,
          abnormal: Boolean(existing.abnormal),
        }
      : row
  })
}

const normalizeTemplateParameters = (template: any) => {
  if (!template) return []

  const rawParameters = Array.isArray(template) ? template : parseJsonArray(template)
  return rawParameters.map((param: any) => ({
    parameter: param.parameter || param.field || param.name || "Unnamed Parameter",
    units: param.units || param.unit || "",
    reference_range: param.reference_range || param.normal_range || param.range || "",
    section: param.section || "Results",
    input_type: param.input_type || param.type || "text",
    options: param.options || [],
    min: param.min,
    max: param.max,
    decimals: param.decimals,
  }))
}

export default function LabResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const requestId = searchParams.get("requestId")

  const [request, setRequest] = useState<any>(null)
  const [template, setTemplate] = useState<any>(null)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [templateLoading, setTemplateLoading] = useState(false)
  const [urgency, setUrgency] = useState("normal")
  const [comments, setComments] = useState("")

  useEffect(() => {
    if (requestId) {
      loadRequest()
    } else {
      setLoading(false)
    }
  }, [requestId])

  const loadRequest = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("lab_requests")
      .select(`
        *,
        visits!inner (
          patient:patients(*)
        ),
        lab_test_master(*)
      `)
      .eq("id", requestId)
      .single()

    if (error) {
      console.error("Failed to load request", error)
    } else {
      setRequest(data)
      const clinicalTemplate = getClinicalTemplate(data.lab_test_master?.test_name)
      const fallbackTemplateParameters = clinicalTemplate?.parameters || normalizeTemplateParameters(data.lab_test_master?.template)
      const loadedTemplate = await loadTemplate(data.lab_test_master?.id, fallbackTemplateParameters, data.lab_test_master?.test_name)
      await loadExistingResults(loadedTemplate?.parameters || fallbackTemplateParameters)
    }
    setLoading(false)
  }

  const loadTemplate = async (testId: string, fallbackTemplateParameters: any[] = [], testName?: string) => {
    setTemplateLoading(true)
    const { data, error } = await supabase
      .from("lab_result_templates")
      .select("*")
      .eq("test_id", testId)

    if (error) {
      console.error("Failed to load template", error)
    } else {
      const foundTemplate = data?.[0] || null
      const clinicalTemplate = getClinicalTemplate(testName)
      const templateParameters = clinicalTemplate?.parameters || foundTemplate?.parameters || fallbackTemplateParameters
      setTemplate({ ...(foundTemplate || {}), test_id: testId, name: clinicalTemplate?.name, specimen: clinicalTemplate?.specimen, parameters: templateParameters })
      setResults(buildInitialRows(templateParameters))
    }
    setTemplateLoading(false)
    const clinicalTemplate = getClinicalTemplate(testName)
    return { ...(data?.[0] || {}), test_id: testId, parameters: clinicalTemplate?.parameters || data?.[0]?.parameters || fallbackTemplateParameters }
  }

  const loadExistingResults = async (templateParameters?: any) => {
    const { data, error } = await supabase
      .from("lab_results")
      .select("*")
      .eq("request_id", requestId)

    if (error) {
      console.error("Failed to load results", error)
    } else if (data && data.length > 0) {
      const savedRows = parseJsonArray(data[0].results)
      setResults(buildInitialRows(templateParameters, savedRows))
      setComments(data[0].comments || "")
      setUrgency(data[0].urgency || "normal")
    }
  }

  const updateResult = (index: number, field: keyof ResultRow, value: string | boolean) => {
    setResults((current) =>
      current.map((row, rowIndex) => {
        if (rowIndex !== index) return row

        const nextRow = { ...row, [field]: value }

        if (field === "result") {
          return {
            ...nextRow,
            abnormal: calculateAbnormal(row as LabTemplateParameter, String(value)),
          }
        }

        return nextRow
      })
    )
  }

  const normalizeAbnormality = (row: ResultRow) => {
    const resultText = String(row.result || "").trim()
    if (!resultText) return false

    if (typeof row.abnormal === "boolean") return row.abnormal

    return false
  }

  const resultStatusLabel = (row: ResultRow) => {
    const status = calculateResultStatus(row as LabTemplateParameter, String(row.result || ""))
    if (status === "low") return "Low"
    if (status === "high") return "High"
    if (status === "abnormal") return "Abnormal"
    return "Normal"
  }

  const openPrintableReport = () => {
    if (!request) return

    // `noopener` makes window.open() return null in modern browsers, so the
    // report window could never be populated even when popups were allowed.
    const popup = window.open("", "_blank", "width=1200,height=900")
    if (!popup) {
      alert("Please allow popups to download or print the report.")
      return
    }

    // Detach the new window after retaining the reference needed to render it.
    popup.opener = null

    const reportReference = `LAB-${String(request.id).replace(/-/g, "").slice(0, 10).toUpperCase()}`
    const hospitalName = process.env.NEXT_PUBLIC_HOSPITAL_NAME || "Hospital Laboratory"
    const hospitalAddress = process.env.NEXT_PUBLIC_HOSPITAL_ADDRESS || ""
    const hospitalPhone = process.env.NEXT_PUBLIC_HOSPITAL_PHONE || ""
    const rows = results.map((row) => ({
      ...row,
      abnormal: normalizeAbnormality(row),
    }))

    const patient = request.visits?.patient
    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${request.lab_test_master?.test_name || "Lab Result"}</title>
          <style>
            body { margin: 0; font-family: Arial, Helvetica, sans-serif; background: #eef2f7; color: #0f172a; }
            .sheet { max-width: 980px; margin: 24px auto; background: #fff; border: 1px solid #d8e0ea; border-radius: 20px; overflow: hidden; }
            .top { background: linear-gradient(135deg, #020617, #1e293b); color: white; padding: 26px 30px; display: flex; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
            .top h1, .top p { margin: 0; }
            .meta { text-align: right; color: #cbd5e1; font-size: 14px; }
            .section { padding: 22px 30px; border-bottom: 1px solid #e2e8f0; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
            .card { border: 1px solid #d8e0ea; background: #f8fafc; border-radius: 14px; padding: 14px; }
            .label { font-size: 11px; letter-spacing: .22em; text-transform: uppercase; color: #64748b; margin-bottom: 6px; }
            .value { font-size: 14px; font-weight: 700; }
            table { width: 100%; border-collapse: collapse; font-size: 14px; }
            th, td { padding: 11px 10px; border-bottom: 1px solid #e2e8f0; text-align: left; vertical-align: top; }
            th { background: #f1f5f9; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: #334155; }
            .pill { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
            .normal { background: #dcfce7; color: #166534; }
            .abnormal { background: #fee2e2; color: #b91c1c; }
            .note { background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; border-radius: 14px; padding: 16px; line-height: 1.6; }
            .footer { padding: 18px 30px 28px; font-size: 12px; color: #64748b; }
            .no-print { padding: 16px 24px; text-align: right; }
            .btn { padding: 10px 16px; border: 0; border-radius: 10px; background: #0f172a; color: #fff; font-weight: 700; cursor: pointer; }
            @media print {
              body { background: white; }
              .sheet { margin: 0; border: 0; border-radius: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="no-print"><button class="btn" onclick="window.print()">Print / Save as PDF</button></div>
          <div class="sheet">
            <div class="top">
              <div>
                <p style="font-size:11px;letter-spacing:.35em;text-transform:uppercase;color:#cbd5e1;">Medical Laboratory Report</p>
                <h1 style="font-size:28px;margin-top:8px;">${hospitalName}</h1>
                ${hospitalAddress ? `<p style="margin-top:6px;color:#cbd5e1;">${hospitalAddress}</p>` : ""}
                ${hospitalPhone ? `<p style="color:#cbd5e1;">Tel: ${hospitalPhone}</p>` : ""}
                <p style="margin-top:6px;color:#cbd5e1;">${request.lab_test_master?.department || "Diagnostic Services"}</p>
              </div>
              <div class="meta">
                <div style="font-size:11px;letter-spacing:.25em;text-transform:uppercase;color:#cbd5e1;">Report Reference</div>
                <div style="margin-top:6px;font-weight:700;letter-spacing:.04em;">${reportReference}</div>
                <div style="margin-top:4px;">Released: ${new Date().toLocaleString()}</div>
              </div>
            </div>
            <div class="section">
              <div class="grid">
                <div class="card"><div class="label">Patient</div><div class="value">${patient?.first_name || ""} ${patient?.last_name || ""}</div></div>
                <div class="card"><div class="label">Patient Number</div><div class="value">${patient?.patient_number || patient?.id || "—"}</div></div>
                <div class="card"><div class="label">Age / Gender</div><div class="value">${patient?.age || "—"}${patient?.gender ? ` / ${patient.gender}` : ""}</div></div>
                <div class="card"><div class="label">Clinic</div><div class="value">${request.visits?.clinic_name || request.clinic_name || "—"}</div></div>
                <div class="card"><div class="label">Requesting Doctor</div><div class="value">${request.requesting_doctor || request.doctor_name || "—"}</div></div>
                <div class="card"><div class="label">Urgency</div><div class="value">${urgency}</div></div>
              </div>
            </div>
            <div class="section">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;">
                <div>
                  <div class="label" style="margin-bottom:4px;">Laboratory Results</div>
                  <div style="font-size:18px;font-weight:700;">${request.lab_test_master?.test_name || "Analysis Summary"}</div>
                </div>
                <span class="pill ${rows.some((row: any) => row.abnormal) ? "abnormal" : "normal"}">${rows.some((row: any) => row.abnormal) ? "Review Required" : "Within Normal Limits"}</span>
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
                  ${rows.map((row: any) => `
                    <tr>
                      <td>${row.parameter || ""}</td>
                      <td>${row.result || ""} ${row.units || ""}</td>
                      <td>${row.reference_range || "—"}</td>
                      <td>${resultStatusLabel(row)}</td>
                    </tr>
                  `).join("") || `<tr><td colspan="4">No result values were recorded.</td></tr>`}
                </tbody>
              </table>
            </div>
            <div class="section" style="border-bottom:0;">
              <div class="grid">
                <div class="note">
                  <div class="label" style="color:#9a3412;">General Impression</div>
                  ${comments?.trim() || (rows.some((row: any) => row.abnormal) ? "Some values are outside the normal range and should be reviewed in the context of the full clinical picture." : "All results are within normal limits.")}
                </div>
                <div class="card">
                  <div class="label">Report Details</div>
                  <div class="value" style="font-weight:600;">Status: ${request.lab_test_master?.status || "draft"}</div>
                  <div style="margin-top:8px;color:#475569;">This is an electronic copy of the laboratory report.</div>
                </div>
              </div>
            </div>
            <div class="footer">The isolated analysis of this exam has no diagnostic value unless evaluated in conjunction with clinical and complementary exam data.</div>
          </div>
        </body>
      </html>
    `

    popup.document.open()
    popup.document.write(html)
    popup.document.close()
    popup.focus()
    window.setTimeout(() => { if (!popup.closed) popup.print() }, 300)
  }

  const saveResults = async () => {
    const incomplete = results.filter((row) => !String(row.result || "").trim())
    if (incomplete.length > 0) {
      alert(`Complete all required result fields. Missing: ${incomplete.map((row) => row.parameter).join(", ")}`)
      return
    }

    setSaving(true)

    const resultData = {
      request_id: requestId,
      results: JSON.stringify(results),
      status: "pending_verification",
      technician_id: "current_user", // TODO: get from auth
      entered_at: new Date().toISOString(),
      urgency: urgency,
      comments: comments
    }

    const { error } = await supabase
      .from("lab_results")
      .upsert([resultData])

    if (error) {
      console.error("Failed to save results", error)
      alert("Could not save results")
    } else {
      await supabase.from("lab_requests").update({ status: "awaiting_validation" }).eq("id", requestId)
      alert("Results saved for verification")
      router.push("/lab/validation")
    }
    setSaving(false)
  }

  if (loading) return <p className="p-6">Loading...</p>
  if (!requestId) return <div className="p-8 text-center"><p className="font-semibold text-slate-800">Select a paid request first</p><p className="mt-1 text-sm text-slate-500">Result entry follows sample collection in the paid queue.</p><button onClick={() => router.push("/lab/lab-queue")} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Open paid requests</button></div>
  if (!request) return <p className="p-6">Request not found.</p>

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Result Entry</p>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              {request.visits?.patient?.first_name} {request.visits?.patient?.last_name} - {request.lab_test_master?.test_name}
            </h1>
            <p className="text-sm text-slate-500 mt-2">Request ID: {request.id}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.push("/lab/lab-queue")}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Back to Paid Queue
            </button>
            <button
              onClick={() => router.push("/lab/validation")}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
            >
              Go to Validation
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <FlowStep number="1" title="Open request" text="Pick a lab request from Test Requests." />
          <FlowStep number="2" title="Fill results" text="Enter the values for this test only." />
          <FlowStep number="3" title="Save draft" text="Store the result for verification." />
          <FlowStep number="4" title="Download report" text="Print or save the filled report as PDF." />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] items-start">
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-semibold text-slate-900">Test Results</h3>
              <p className="text-sm text-gray-500">Fill the fields below, then save and download the completed report.</p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>{templateLoading ? "Loading template..." : template?.name || `Template for ${request.lab_test_master?.test_name}`}</p>
              {template?.specimen && <p className="mt-1 text-xs">Specimen: <span className="font-medium text-slate-700">{template.specimen}</span></p>}
            </div>
          </div>

          {template ? (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full border-collapse border">
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
                  {results.map((result, index) => (
                    <Fragment key={`${result.parameter}-${index}`}>
                    {(index === 0 || results[index - 1]?.section !== result.section) && <tr><td colSpan={5} className="border-y bg-slate-800 px-3 py-2 text-xs font-bold uppercase tracking-wider text-white">{result.section || "Results"}</td></tr>}
                    <tr className={result.abnormal ? "bg-red-50" : ""}>
                      <td className="border p-2 font-medium">{result.parameter}</td>
                      <td className="border p-2">
                        {result.input_type === "select" ? (
                          <select value={result.result} onChange={(e) => updateResult(index, "result", e.target.value)} className="w-full rounded border border-slate-300 bg-white px-2 py-2">
                            <option value="">Select result</option>
                            {(result.options || []).map((option: string) => <option key={option} value={option}>{option}</option>)}
                          </select>
                        ) : (
                          <input type={result.input_type === "number" ? "number" : "text"} step={result.input_type === "number" ? (result.decimals ? 1 / (10 ** result.decimals) : "any") : undefined} value={result.result} onChange={(e) => updateResult(index, "result", e.target.value)} className="w-full rounded border border-slate-300 px-2 py-2 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder={`Enter ${result.parameter}`} />
                        )}
                      </td>
                      <td className="border p-2">{result.units}</td>
                      <td className="border p-2">{result.reference_range}</td>
                      <td className="border p-2">
                        {!result.result ? <span className="text-xs text-slate-400">Not entered</span> : result.abnormal ? <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">{resultStatusLabel(result)}</span> : <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">Within range</span>}
                      </td>
                    </tr>
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No template found for this test. Please configure result template first.</p>
          )}

          <div className="mt-6 space-y-4">
            <div>
              <label className="block mb-2">
                <span className="font-semibold">Urgency Level:</span>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-full border rounded px-3 py-2 mt-1"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                </select>
              </label>
            </div>

            <label className="block mb-2">
              <span className="font-semibold">Comments:</span>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full border rounded px-3 py-2 mt-1"
                rows={3}
                placeholder="Additional comments or interpretation"
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={saveResults}
                disabled={saving || templateLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Results"}
              </button>

              <button
                onClick={openPrintableReport}
                disabled={!template || templateLoading}
                className="bg-slate-900 text-white px-4 py-2 rounded hover:bg-slate-800 disabled:opacity-50"
              >
                Download Filled Report
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow space-y-4">
          <div>
            <h3 className="font-semibold mb-1">Live Preview</h3>
            <p className="text-sm text-gray-500">This preview updates as you type and matches the downloaded report.</p>
          </div>

          {template ? (
            <div className="overflow-x-auto">
              <LabResultTemplate
                patientName={`${request.visits?.patient?.first_name || ""} ${request.visits?.patient?.last_name || ""}`.trim() || "—"}
                patientNumber={request.visits?.patient?.patient_number || request.visits?.patient?.id || null}
                age={request.visits?.patient?.age || request.visits?.patient?.date_of_birth || null}
                gender={request.visits?.patient?.gender || null}
                requestId={request.id}
                testName={request.lab_test_master?.test_name}
                requestingDoctor={request.requesting_doctor || request.doctor_name || null}
                clinicName={request.visits?.clinic_name || request.clinic_name || null}
                collectionDate={request.collection_date || request.created_at}
                receivedDate={request.received_date || request.created_at}
                reportDate={new Date().toISOString()}
                results={results.map((row) => ({
                  ...row,
                  abnormal: Boolean(row.abnormal),
                }))}
                comments={comments}
              />
            </div>
          ) : (
            <p className="text-gray-500">Preview is available when a template is configured for this test.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function FlowStep({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
          {number}
        </div>
        <div>
          <p className="font-semibold text-slate-900">{title}</p>
          <p className="text-sm text-slate-600">{text}</p>
        </div>
      </div>
    </div>
  )
}
