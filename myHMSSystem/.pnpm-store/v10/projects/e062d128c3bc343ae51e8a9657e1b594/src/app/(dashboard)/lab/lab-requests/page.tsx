"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

interface Patient {
  id: string
  first_name: string
  last_name: string
}

interface LabTest {
  id: string
  test_name: string
  price: number
}

interface LabRequest {
  id: string
  created_at: string
  visits: {
    patient: Patient
  }
  lab_test_master: LabTest
  status: string
}

export default function LabRequests() {
  const [requests, setRequests] = useState<LabRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [patients, setPatients] = useState<Patient[]>([])
  const [tests, setTests] = useState<LabTest[]>([])
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    patientId: "",
    testId: "",
    notes: ""
  })

  useEffect(() => {
    loadRequests()
    loadPatients()
    loadTests()
  }, [])

  const loadRequests = async () => {
    setLoading(true)
    const query = supabase
      .from("lab_requests")
      .select(`
        *,
        visits!inner (
          patient:patients(*)
        ),
        lab_test_master(*)
      `)
      .order("created_at", { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error("Failed to load requests", error)
    } else {
      setRequests(data || [])
    }
    setLoading(false)
  }

  const loadPatients = async () => {
    const { data } = await supabase.from("patients").select("id, first_name, last_name")
    setPatients(data || [])
  }

  const loadTests = async () => {
    const { data } = await supabase.from("lab_test_master").select("id, test_name, price")
    setTests(data || [])
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

  const createLabRequest = async () => {
    if (!formData.patientId || !formData.testId) {
      alert("Please select both patient and test")
      return
    }

    setCreating(true)
    try {
      const selectedTest = tests.find(t => t.id === formData.testId)
      if (!selectedTest) throw new Error("Test not found")

      // 1️⃣ CREATE LAB REQUEST
      const { data: newRequest, error: requestError } = await supabase
        .from("lab_requests")
        .insert({
          patient_id: formData.patientId,
          test_id: formData.testId,
          lab_amount: selectedTest.price,
          notes: formData.notes,
          status: "pending"
        })
        .select()
        .single()

      if (requestError) throw requestError

      // 2️⃣ SILENTLY CREATE INVOICE (NON-BLOCKING)
      try {
        // Check if invoice exists for this patient
        let { data: existingInvoice } = await supabase
          .from("invoices")
          .select("*")
          .eq("patient_id", formData.patientId)
          .maybeSingle()

        if (!existingInvoice) {
          // Create new invoice
          const invoiceNumber = `INV-${Date.now()}`
          const { data: newInvoice } = await supabase
            .from("invoices")
            .insert({
              patient_id: formData.patientId,
              invoice_number: invoiceNumber,
              status: "unpaid",
              total_amount: selectedTest.price,
              paid_amount: 0,
              balance: selectedTest.price
            })
            .select()
            .single()

          // Add line item
          if (newInvoice) {
            await supabase.from("invoice_items").insert({
              invoice_id: newInvoice.id,
              item_type: "lab_test",
              item_id: formData.testId,
              description: selectedTest.test_name,
              quantity: 1,
              unit_price: selectedTest.price,
              total_price: selectedTest.price
            })
          }
        } else {
          // Add to existing invoice
          await supabase.from("invoice_items").insert({
            invoice_id: existingInvoice.id,
            item_type: "lab_test",
            item_id: formData.testId,
            description: selectedTest.test_name,
            quantity: 1,
            unit_price: selectedTest.price,
            total_price: selectedTest.price
          })

          // Update invoice total
          const { data: items } = await supabase
            .from("invoice_items")
            .select("total_price")
            .eq("invoice_id", existingInvoice.id)

          const newTotal = (items || []).reduce(
            (sum: number, item: { total_price: number | null }) => sum + (item.total_price || 0),
            0
          )

          await supabase
            .from("invoices")
            .update({
              total_amount: newTotal,
              balance: newTotal
            })
            .eq("id", existingInvoice.id)
        }
      } catch (billingError) {
        console.error("Billing error (non-blocking):", billingError)
        // Don't fail lab request creation if billing fails
      }

      alert(`✅ Lab test requested: ${selectedTest.test_name}`)
      setFormData({ patientId: "", testId: "", notes: "" })
      setShowForm(false)
      loadRequests()
    } catch (err: any) {
      console.error(err)
      alert("Failed to create lab request: " + err.message)
    } finally {
      setCreating(false)
    }
  }

  const statusOptions = ["pending", "in_progress", "completed", "cancelled"]

  const statusConfig = {
    pending: { color: "bg-yellow-50", border: "border-yellow-200", badge: "bg-yellow-200 text-yellow-800" },
    in_progress: { color: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-200 text-blue-800" },
    completed: { color: "bg-green-50", border: "border-green-200", badge: "bg-green-200 text-green-800" },
    cancelled: { color: "bg-red-50", border: "border-red-200", badge: "bg-red-200 text-red-800" }
  }

  // Group requests by status
  const groupedRequests = statusOptions.reduce((acc, status) => {
    acc[status] = requests
      .filter(r => r.status === status)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return acc
  }, {} as Record<string, LabRequest[]>)

  if (loading) return <p className="p-6">Loading requests...</p>

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Lab Test Requests</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium"
          >
            {showForm ? "Close" : "+ New Request"}
          </button>
        </div>

        {showForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="font-semibold text-lg mb-4">Request New Lab Test</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Patient *</label>
                <select
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  className="border rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 outline-none"
                >
                  <option value="">Select Patient</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Lab Test *</label>
                <select
                  value={formData.testId}
                  onChange={(e) => setFormData({ ...formData, testId: e.target.value })}
                  className="border rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 outline-none"
                >
                  <option value="">Select Test</option>
                  {tests.map(test => (
                    <option key={test.id} value={test.id}>
                      {test.test_name} - KES {test.price.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="border rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 outline-none min-h-[80px]"
                  placeholder="Add any relevant notes..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowForm(false)
                    setFormData({ patientId: "", testId: "", notes: "" })
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={createLabRequest}
                  disabled={creating}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 font-medium"
                >
                  {creating ? "Creating..." : "Create Request"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Requests grouped by status */}
        <div className="space-y-6">
          {statusOptions.map(status => (
            <div key={status} className={`border rounded-lg p-4 ${statusConfig[status as keyof typeof statusConfig].color} ${statusConfig[status as keyof typeof statusConfig].border}`}>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold capitalize">{status.replace("_", " ")}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig[status as keyof typeof statusConfig].badge}`}>
                  {groupedRequests[status]?.length || 0}
                </span>
              </div>

              {groupedRequests[status]?.length === 0 ? (
                <p className="text-gray-500 text-sm">No requests in this status</p>
              ) : (
                <div className="space-y-2">
                  {groupedRequests[status]?.map(request => (
                    <div key={request.id} className="bg-white rounded-lg p-4 border">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-800">
                            {request.lab_test_master?.test_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {request.visits?.patient?.first_name} {request.visits?.patient?.last_name}
                          </p>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          {new Date(request.created_at).toLocaleDateString()} {new Date(request.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <select
                          value={request.status}
                          onChange={(e) => updateStatus(request.id, e.target.value)}
                          className="border rounded px-2 py-1 text-sm flex-1"
                        >
                          {statusOptions.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => window.location.href = `/lab/samples?requestId=${request.id}`}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          Sample
                        </button>
                        <button
                          onClick={() => window.location.href = `/lab/results?requestId=${request.id}`}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          Results
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}