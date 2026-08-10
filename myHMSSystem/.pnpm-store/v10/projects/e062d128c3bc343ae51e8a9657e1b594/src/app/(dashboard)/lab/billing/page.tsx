"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function LabBilling() {
  const [unbilledTests, setUnbilledTests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUnbilledTests()
  }, [])

  const loadUnbilledTests = async () => {
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
      .eq("status", "released")
      .is("billed", null)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to load unbilled tests", error)
    } else {
      setUnbilledTests(data || [])
    }
    setLoading(false)
  }

  const markAsBilled = async (requestId: string, paymentType: string) => {
    const { error } = await supabase
      .from("lab_requests")
      .update({
        billed: true,
        payment_type: paymentType,
        billed_at: new Date().toISOString()
      })
      .eq("id", requestId)

    if (error) {
      console.error("Failed to mark as billed", error)
      alert("Could not update billing status")
    } else {
      alert("Test marked as billed")
      loadUnbilledTests()
    }
  }

  const sendToBillingQueue = async (requestId: string) => {
    // In real implementation, this would integrate with billing system
    alert("Test sent to billing queue")
    markAsBilled(requestId, "cash")
  }

  if (loading) return <p className="p-6">Loading billing data...</p>

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Lab Billing Integration</h1>
        <p className="text-gray-600 mb-4">Manage billing for completed laboratory tests</p>

        {unbilledTests.length === 0 ? (
          <p className="text-gray-500">No unbilled tests</p>
        ) : (
          <div className="space-y-4">
            {unbilledTests.map(test => (
              <div key={test.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold">
                      {test.visits?.patient?.first_name} {test.visits?.patient?.last_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Test: {test.lab_test_master?.test_name} |
                      Cost: ${test.lab_test_master?.cost || "N/A"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Completed: {new Date(test.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => markAsBilled(test.id, "cash")}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Mark Cash Paid
                    </button>
                    <button
                      onClick={() => markAsBilled(test.id, "insurance")}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Insurance Claim
                    </button>
                    <button
                      onClick={() => markAsBilled(test.id, "corporate")}
                      className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                    >
                      Corporate Account
                    </button>
                    <button
                      onClick={() => sendToBillingQueue(test.id)}
                      className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                    >
                      Send to Billing
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 border-t pt-4">
          <h3 className="font-semibold mb-4">Billing Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded">
              <div className="text-2xl font-bold text-blue-800">{unbilledTests.length}</div>
              <div className="text-sm text-blue-600">Pending Billing</div>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <div className="text-2xl font-bold text-green-800">
                ${unbilledTests.reduce((sum, test) => sum + (test.lab_test_master?.cost || 0), 0)}
              </div>
              <div className="text-sm text-green-600">Potential Revenue</div>
            </div>
            <div className="bg-purple-50 p-4 rounded">
              <div className="text-2xl font-bold text-purple-800">
                {unbilledTests.filter(t => t.urgency === "urgent").length}
              </div>
              <div className="text-sm text-purple-600">Urgent Tests</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}