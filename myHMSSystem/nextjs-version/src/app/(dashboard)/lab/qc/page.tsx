"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function LabQualityControl() {
  const [qcLogs, setQcLogs] = useState<any[]>([])
  const [reagents, setReagents] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("qc")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadQCLogs()
    loadReagents()
  }, [])

  const loadQCLogs = async () => {
    const { data, error } = await supabase
      .from("lab_qc_logs")
      .select("*")
      .order("date_performed", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Failed to load QC logs", error)
    } else {
      setQcLogs(data || [])
    }
  }

  const loadReagents = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("lab_reagents")
      .select("*")
      .order("expiry_date", { ascending: true })

    if (error) {
      console.error("Failed to load reagents", error)
    } else {
      setReagents(data || [])
    }
    setLoading(false)
  }

  const addQCLog = async (log: any) => {
    const { error } = await supabase
      .from("lab_qc_logs")
      .insert([log])

    if (error) {
      console.error("Failed to add QC log", error)
      alert("Could not add QC log")
    } else {
      loadQCLogs()
    }
  }

  const addReagent = async (reagent: any) => {
    const { error } = await supabase
      .from("lab_reagents")
      .insert([reagent])

    if (error) {
      console.error("Failed to add reagent", error)
      alert("Could not add reagent")
    } else {
      loadReagents()
    }
  }

  const updateReagentStock = async (id: string, newStock: number) => {
    const { error } = await supabase
      .from("lab_reagents")
      .update({ current_stock: newStock })
      .eq("id", id)

    if (error) {
      console.error("Failed to update reagent stock", error)
    } else {
      loadReagents()
    }
  }

  const expiringReagents = reagents.filter(r => {
    const expiry = new Date(r.expiry_date)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  })

  const expiredReagents = reagents.filter(r => new Date(r.expiry_date) < new Date())

  if (loading) return <p className="p-6">Loading quality control data...</p>

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Quality Control & Reagents</h1>

        <div className="flex border-b mb-4">
          <button
            onClick={() => setActiveTab("qc")}
            className={`px-4 py-2 ${activeTab === "qc" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"}`}
          >
            QC Logs
          </button>
          <button
            onClick={() => setActiveTab("reagents")}
            className={`px-4 py-2 ${activeTab === "reagents" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"}`}
          >
            Reagents & Consumables
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className={`px-4 py-2 ${activeTab === "alerts" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"}`}
          >
            Alerts ({expiringReagents.length + expiredReagents.length})
          </button>
        </div>

        {activeTab === "qc" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Quality Control Logs</h2>
              <button
                onClick={() => {
                  const test = prompt("Test Name:")
                  const result = prompt("QC Result:")
                  const acceptable = confirm("Acceptable?")
                  if (test && result) {
                    addQCLog({
                      test_name: test,
                      result: result,
                      acceptable: acceptable,
                      date_performed: new Date().toISOString().split("T")[0],
                      performed_by: "current_user"
                    })
                  }
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Add QC Log
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Date</th>
                    <th className="border p-2">Test</th>
                    <th className="border p-2">Result</th>
                    <th className="border p-2">Acceptable</th>
                    <th className="border p-2">Performed By</th>
                  </tr>
                </thead>
                <tbody>
                  {qcLogs.map(log => (
                    <tr key={log.id}>
                      <td className="border p-2">{log.date_performed}</td>
                      <td className="border p-2">{log.test_name}</td>
                      <td className="border p-2">{log.result}</td>
                      <td className="border p-2">
                        <span className={log.acceptable ? "text-green-600" : "text-red-600"}>
                          {log.acceptable ? "✓" : "✗"}
                        </span>
                      </td>
                      <td className="border p-2">{log.performed_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "reagents" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Reagents & Consumables</h2>
              <button
                onClick={() => {
                  const name = prompt("Reagent Name:")
                  const lot = prompt("Lot Number:")
                  const expiry = prompt("Expiry Date (YYYY-MM-DD):")
                  const stock = prompt("Initial Stock:")
                  if (name && lot && expiry && stock) {
                    addReagent({
                      reagent_name: name,
                      lot_number: lot,
                      expiry_date: expiry,
                      current_stock: parseInt(stock),
                      unit: "units"
                    })
                  }
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Add Reagent
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Reagent</th>
                    <th className="border p-2">Lot Number</th>
                    <th className="border p-2">Expiry Date</th>
                    <th className="border p-2">Current Stock</th>
                    <th className="border p-2">Status</th>
                    <th className="border p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reagents.map(reagent => {
                    const isExpired = new Date(reagent.expiry_date) < new Date()
                    const daysUntilExpiry = Math.ceil((new Date(reagent.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0

                    return (
                      <tr key={reagent.id} className={isExpired ? "bg-red-50" : isExpiringSoon ? "bg-yellow-50" : ""}>
                        <td className="border p-2">{reagent.reagent_name}</td>
                        <td className="border p-2">{reagent.lot_number}</td>
                        <td className="border p-2">{reagent.expiry_date}</td>
                        <td className="border p-2">{reagent.current_stock}</td>
                        <td className="border p-2">
                          {isExpired ? (
                            <span className="text-red-600 font-semibold">EXPIRED</span>
                          ) : isExpiringSoon ? (
                            <span className="text-yellow-600 font-semibold">Expiring Soon</span>
                          ) : (
                            <span className="text-green-600">Active</span>
                          )}
                        </td>
                        <td className="border p-2">
                          <button
                            onClick={() => {
                              const newStock = prompt("New Stock Level:", reagent.current_stock.toString())
                              if (newStock) updateReagentStock(reagent.id, parseInt(newStock))
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Update Stock
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "alerts" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Quality Alerts</h2>

            {expiredReagents.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-red-600 mb-2">Expired Reagents</h3>
                <div className="space-y-2">
                  {expiredReagents.map(reagent => (
                    <div key={reagent.id} className="bg-red-50 border border-red-200 p-3 rounded">
                      <strong>{reagent.reagent_name}</strong> (Lot: {reagent.lot_number}) - Expired on {reagent.expiry_date}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {expiringReagents.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-yellow-600 mb-2">Expiring Soon (≤30 days)</h3>
                <div className="space-y-2">
                  {expiringReagents.map(reagent => {
                    const days = Math.ceil((new Date(reagent.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    return (
                      <div key={reagent.id} className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                        <strong>{reagent.reagent_name}</strong> (Lot: {reagent.lot_number}) - Expires in {days} days ({reagent.expiry_date})
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {expiredReagents.length === 0 && expiringReagents.length === 0 && (
              <p className="text-green-600">✓ All reagents are within expiry dates</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}