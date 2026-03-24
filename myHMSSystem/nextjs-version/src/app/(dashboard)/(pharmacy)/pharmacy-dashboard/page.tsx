"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function PharmacistDashboard() {
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [dispenseQuantities, setDispenseQuantities] = useState<Record<string, number>>({}) // {prescriptionId: quantity}

  // Fetch pending prescriptions and inventory
  async function fetchData() {
    const { data: prescData, error: prescError } = await supabase
      .from("prescriptions")
      .select(`*, drugs(name, price, unit)`)
      .eq("status", "PENDING")
    if (prescError) console.error(prescError)
    else setPrescriptions(prescData || [])

    const { data: invData, error: invError } = await supabase
      .from("drug_batches")
      .select(`*, drugs(name, price)`)
      .gte("quantity", 1)
    if (invError) console.error(invError)
    else setInventory(invData || [])
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000) // Poll every 5s for real-time updates
    return () => clearInterval(interval)
  }, [])

  // Dispense medicine function
  async function dispensePrescription(prescription) {
    const qty = dispenseQuantities[prescription.id] || prescription.quantity
    if (!qty || qty <= 0) return alert("Enter valid quantity")

    setLoading(true)

    // Find available batch (non-expired, enough quantity)
    const batch = inventory.find(
      b => b.drug_id === prescription.drug_id &&
           new Date(b.expiry_date) > new Date() &&
           b.quantity >= qty
    )
    if (!batch) {
      setLoading(false)
      return alert("Insufficient stock or expired drug")
    }

    const totalPrice = batch.drugs.price * qty

    // 1️⃣ Reduce inventory
    await supabase
      .from("drug_batches")
      .update({ quantity: batch.quantity - qty })
      .eq("id", batch.id)

    // 2️⃣ Log stock movement
    await supabase.from("stock_movements").insert({
      drug_batch_id: batch.id,
      type: "OUT",
      quantity: qty,
      reference: "Dispensed to patient",
      department: prescription.department,
      patient_visit_id: prescription.patient_visit_id,
      user_id: "pharmacist-user-id" // Replace with auth user id
    })

    // 3️⃣ Update prescription status
    await supabase
      .from("prescriptions")
      .update({ status: "DISPENSED" })
      .eq("id", prescription.id)

    alert(`Dispensed ${qty} ${batch.drugs.unit}(s) of ${batch.drugs.name}. Total price: $${totalPrice.toFixed(2)}`)

    setLoading(false)
    fetchData()
  }

  // Track quantity input changes
  const handleQtyChange = (prescriptionId, value) => {
    setDispenseQuantities({ ...dispenseQuantities, [prescriptionId]: parseInt(value) })
  }

  // Low stock & expiry alerts
  const lowStockBatches = inventory.filter(b => b.quantity <= 5)
  const nearExpiryBatches = inventory.filter(b => new Date(b.expiry_date) <= new Date(Date.now() + 90*24*60*60*1000))

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Pharmacist Dashboard - Prescription Queue</h1>

      {/* Alerts */}
      {lowStockBatches.length > 0 && (
        <div className="p-4 bg-red-200 rounded">
          ⚠️ Low Stock Alert: {lowStockBatches.map(b => b.drugs.name).join(", ")}
        </div>
      )}
      {nearExpiryBatches.length > 0 && (
        <div className="p-4 bg-yellow-200 rounded">
          ⚠️ Near Expiry Alert: {nearExpiryBatches.map(b => `${b.drugs.name} (Batch ${b.batch_number})`).join(", ")}
        </div>
      )}

      {/* Prescription Queue Table */}
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Patient Visit ID</th>
            <th className="border p-2">Drug</th>
            <th className="border p-2">Qty Prescribed</th>
            <th className="border p-2">Unit Price</th>
            <th className="border p-2">Qty to Dispense</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {prescriptions.map(p => (
            <tr key={p.id}>
              <td className="border p-2">{p.patient_visit_id}</td>
              <td className="border p-2">{p.drugs.name}</td>
              <td className="border p-2">{p.quantity}</td>
              <td className="border p-2">${p.drugs.price.toFixed(2)}</td>
              <td className="border p-2">
                <input
                  type="number"
                  value={dispenseQuantities[p.id] || p.quantity}
                  min={1}
                  max={p.quantity}
                  onChange={e => handleQtyChange(p.id, e.target.value)}
                  className="border p-1 rounded w-20"
                />
              </td>
              <td className="border p-2">
                <button
                  className="bg-green-600 text-white px-3 py-1 rounded"
                  disabled={loading}
                  onClick={() => dispensePrescription(p)}
                >
                  {loading ? "Processing..." : "Dispense"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}