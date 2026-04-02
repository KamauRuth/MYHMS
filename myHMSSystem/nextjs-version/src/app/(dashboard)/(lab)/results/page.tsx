"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function LabResults() {
  const searchParams = useSearchParams()
  const requestId = searchParams.get("requestId")

  const [request, setRequest] = useState<any>(null)
  const [template, setTemplate] = useState<any>(null)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [urgency, setUrgency] = useState("normal")
  const [comments, setComments] = useState("")

  useEffect(() => {
    if (requestId) {
      loadRequest()
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
      loadTemplate(data.lab_test_master?.id)
      loadExistingResults()
    }
    setLoading(false)
  }

  const loadTemplate = async (testId: string) => {
    const { data, error } = await supabase
      .from("lab_result_templates")
      .select("*")
      .eq("test_id", testId)

    if (error) {
      console.error("Failed to load template", error)
    } else {
      setTemplate(data?.[0] || null)
      if (data?.[0]?.parameters) {
        setResults(JSON.parse(data[0].parameters).map((param: any) => ({
          parameter: param.parameter,
          result: "",
          units: param.units,
          reference_range: param.reference_range,
          abnormal: false
        })))
      }
    }
  }

  const loadExistingResults = async () => {
    const { data, error } = await supabase
      .from("lab_results")
      .select("*")
      .eq("request_id", requestId)

    if (error) {
      console.error("Failed to load results", error)
    } else if (data && data.length > 0) {
      setResults(JSON.parse(data[0].results))
    }
  }

  const saveResults = async () => {
    setSaving(true)

    // Check and deduct reagents for this test
    const testReagents = await getTestReagents(request.lab_test_master?.id)
    for (const reagent of testReagents) {
      const { data: stockData, error: stockError } = await supabase
        .from("pharmacy_stock")
        .select("current_stock")
        .eq("medicine_name", reagent.reagent_name)
        .single()

      if (stockError || !stockData || stockData.current_stock < reagent.quantity_needed) {
        alert(`Insufficient stock for reagent: ${reagent.reagent_name}`)
        setSaving(false)
        return
      }

      // Deduct reagent
      await supabase
        .from("pharmacy_stock")
        .update({ current_stock: stockData.current_stock - reagent.quantity_needed })
        .eq("medicine_name", reagent.reagent_name)

      // Record reagent consumption
      await supabase
        .from("lab_reagent_consumption")
        .insert([{
          test_id: request.lab_test_master?.id,
          reagent_name: reagent.reagent_name,
          quantity_used: reagent.quantity_needed,
          consumed_at: new Date().toISOString(),
          consumed_by: "current_user"
        }])
    }

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
      alert("Results saved for verification")
    }
    setSaving(false)
  }

  const getTestReagents = async (testId: string) => {
    // This would typically come from a test_reagents table
    // For now, return mock data based on test type
    const testReagents: any[] = []

    if (request?.lab_test_master?.test_name?.toLowerCase().includes("cbc")) {
      testReagents.push({ reagent_name: "CBC Reagent Kit", quantity_needed: 1 })
    } else if (request?.lab_test_master?.test_name?.toLowerCase().includes("glucose")) {
      testReagents.push({ reagent_name: "Glucose Test Strips", quantity_needed: 1 })
    } else if (request?.lab_test_master?.test_name?.toLowerCase().includes("lft")) {
      testReagents.push({ reagent_name: "LFT Reagent Kit", quantity_needed: 1 })
    }
    // Add more test-specific reagents as needed

    return testReagents
  }

  if (loading) return <p className="p-6">Loading...</p>
  if (!request) return <p className="p-6">Request not found.</p>

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-2">Result Entry</h1>
        <p className="text-lg">
          {request.visits?.patient?.first_name} {request.visits?.patient?.last_name} - {request.lab_test_master?.test_name}
        </p>
        <p className="text-sm text-gray-500">Request ID: {request.id}</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-semibold mb-4">Test Results</h3>

        {template ? (
          <div className="overflow-x-auto">
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
                  <tr key={index} className={result.abnormal ? "bg-red-50" : ""}>
                    <td className="border p-2">{result.parameter}</td>
                    <td className="border p-2">
                      <input
                        type="text"
                        value={result.result}
                        onChange={(e) => updateResult(index, "result", e.target.value)}
                        className="w-full border rounded px-2 py-1"
                      />
                    </td>
                    <td className="border p-2">{result.units}</td>
                    <td className="border p-2">{result.reference_range}</td>
                    <td className="border p-2">
                      {result.abnormal ? (
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

          <button
            onClick={saveResults}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Results"}
          </button>
        </div>
      </div>
    </div>
  )
}