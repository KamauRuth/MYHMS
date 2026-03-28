"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function PharmacyDashboard() {
  const [medicines, setMedicines] = useState<any[]>([])
  const [lowStock, setLowStock] = useState<any[]>([])
  const [expiringSoon, setExpiringSoon] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMedicines()
  }, [])

  const loadMedicines = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("pharmacy_stock")
      .select("*")
      .order("expiry_date", { ascending: true })

    if (error) {
      console.error("Failed to load medicines", error)
    } else {
      setMedicines(data || [])

      // Filter low stock (less than 10 units)
      const low = data?.filter(med => med.current_stock < 10) || []
      setLowStock(low)

      // Filter expiring soon (within 30 days)
      const expiring = data?.filter(med => {
        const expiry = new Date(med.expiry_date)
        const now = new Date()
        const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0
      }) || []
      setExpiringSoon(expiring)
    }
    setLoading(false)
  }

  const addMedicine = async (medicine: any) => {
    const { error } = await supabase
      .from("pharmacy_stock")
      .insert([medicine])

    if (error) {
      console.error("Failed to add medicine", error)
      alert("Could not add medicine")
    } else {
      loadMedicines()
    }
  }

  const updateStock = async (id: string, newStock: number) => {
    const { error } = await supabase
      .from("pharmacy_stock")
      .update({ current_stock: newStock })
      .eq("id", id)

    if (error) {
      console.error("Failed to update stock", error)
    } else {
      loadMedicines()
    }
  }

  const dispenseMedicine = async (medicineId: string, quantity: number, patientId: string) => {
    const medicine = medicines.find(m => m.id === medicineId)
    if (!medicine || medicine.current_stock < quantity) {
      alert("Insufficient stock")
      return
    }

    // Update stock
    const { error: stockError } = await supabase
      .from("pharmacy_stock")
      .update({ current_stock: medicine.current_stock - quantity })
      .eq("id", medicineId)

    if (stockError) {
      console.error("Failed to update stock", stockError)
      return
    }

    // Record dispensing
    const { error: dispenseError } = await supabase
      .from("pharmacy_dispensing")
      .insert([{
        medicine_id: medicineId,
        patient_id: patientId,
        quantity_dispensed: quantity,
        dispensed_by: "current_user", // TODO: get from auth
        dispensed_at: new Date().toISOString()
      }])

    if (dispenseError) {
      console.error("Failed to record dispensing", dispenseError)
    } else {
      alert("Medicine dispensed successfully")
      loadMedicines()
    }
  }

  if (loading) return <p className="p-6">Loading pharmacy data...</p>

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Pharmacy Management</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-100 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-800">{medicines.length}</div>
            <div className="text-sm text-blue-600">Total Medicines</div>
          </div>
          <div className="bg-red-100 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-800">{lowStock.length}</div>
            <div className="text-sm text-red-600">Low Stock Items</div>
          </div>
          <div className="bg-yellow-100 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-800">{expiringSoon.length}</div>
            <div className="text-sm text-yellow-600">Expiring Soon</div>
          </div>
          <div className="bg-green-100 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-800">
              {medicines.reduce((sum, med) => sum + med.current_stock, 0)}
            </div>
            <div className="text-sm text-green-600">Total Stock Units</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-4">Stock Management</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {medicines.map(medicine => {
                const isLowStock = medicine.current_stock < 10
                const expiry = new Date(medicine.expiry_date)
                const now = new Date()
                const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0
                const isExpired = daysUntilExpiry < 0

                return (
                  <div key={medicine.id} className={`border rounded p-3 ${isLowStock || isExpired ? 'bg-red-50' : isExpiringSoon ? 'bg-yellow-50' : 'bg-white'}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <strong>{medicine.medicine_name}</strong>
                        <div className="text-sm text-gray-600">
                          Stock: {medicine.current_stock} {medicine.unit} |
                          Expiry: {medicine.expiry_date}
                        </div>
                        <div className="text-xs">
                          {isExpired && <span className="text-red-600 font-semibold">EXPIRED</span>}
                          {isExpiringSoon && !isExpired && <span className="text-yellow-600 font-semibold">Expires in {daysUntilExpiry} days</span>}
                          {isLowStock && <span className="text-red-600 font-semibold ml-2">LOW STOCK</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const newStock = prompt("New Stock Level:", medicine.current_stock.toString())
                            if (newStock) updateStock(medicine.id, parseInt(newStock))
                          }}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          Update
                        </button>
                        <button
                          onClick={() => {
                            const quantity = prompt("Dispense Quantity:")
                            const patientId = prompt("Patient ID:")
                            if (quantity && patientId) {
                              dispenseMedicine(medicine.id, parseInt(quantity), patientId)
                            }
                          }}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          Dispense
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Add New Medicine</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target as HTMLFormElement)
                addMedicine({
                  medicine_name: formData.get("medicine_name"),
                  generic_name: formData.get("generic_name"),
                  category: formData.get("category"),
                  current_stock: parseInt(formData.get("current_stock") as string),
                  unit: formData.get("unit"),
                  expiry_date: formData.get("expiry_date"),
                  supplier: formData.get("supplier"),
                  cost_price: parseFloat(formData.get("cost_price") as string),
                  selling_price: parseFloat(formData.get("selling_price") as string)
                })
                ;(e.target as HTMLFormElement).reset()
              }}
              className="space-y-3"
            >
              <input name="medicine_name" placeholder="Medicine Name" required className="w-full border rounded px-3 py-2" />
              <input name="generic_name" placeholder="Generic Name" className="w-full border rounded px-3 py-2" />
              <select name="category" required className="w-full border rounded px-3 py-2">
                <option value="">Select Category</option>
                <option value="Antibiotics">Antibiotics</option>
                <option value="Analgesics">Analgesics</option>
                <option value="Antihypertensives">Antihypertensives</option>
                <option value="Antidiabetics">Antidiabetics</option>
                <option value="Vaccines">Vaccines</option>
                <option value="Lab Reagents">Lab Reagents</option>
                <option value="Other">Other</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input name="current_stock" type="number" placeholder="Stock" required className="border rounded px-3 py-2" />
                <input name="unit" placeholder="Unit (tabs, vials, etc.)" required className="border rounded px-3 py-2" />
              </div>
              <input name="expiry_date" type="date" required className="w-full border rounded px-3 py-2" />
              <input name="supplier" placeholder="Supplier" className="w-full border rounded px-3 py-2" />
              <div className="grid grid-cols-2 gap-2">
                <input name="cost_price" type="number" step="0.01" placeholder="Cost Price" required className="border rounded px-3 py-2" />
                <input name="selling_price" type="number" step="0.01" placeholder="Selling Price" required className="border rounded px-3 py-2" />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Add Medicine
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}