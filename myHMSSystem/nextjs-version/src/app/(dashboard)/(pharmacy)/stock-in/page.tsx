"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function StockInPage() {
  const [drugs, setDrugs] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const [formData, setFormData] = useState({
    drug_id: "",
    supplier_id: "",
    batch_number: "",
    quantity_received: "",
    unit_cost: "",
    selling_price: "",
    received_date: new Date().toISOString().split("T")[0],
    expiry_date: "",
    storage_location: "",
    markup_percentage: "30",
  })

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Load active drugs
        const { data: drugsData, error: drugsError } = await supabase
          .from("drugs")
          .select("id, drug_name, generic_name, strength, unit_of_measure")
          .eq("is_active", true)
          .order("drug_name")

        // Load active suppliers
        const { data: suppliersData, error: suppliersError } = await supabase
          .from("suppliers")
          .select("id, supplier_name, supplier_code")
          .eq("is_active", true)
          .order("supplier_name")

        if (drugsData) setDrugs(drugsData)
        if (suppliersData) setSuppliers(suppliersData)

        if (drugsError) console.error("Failed to load drugs:", drugsError)
        if (suppliersError) console.error("Failed to load suppliers:", suppliersError)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      // Validate form
      if (
        !formData.drug_id ||
        !formData.supplier_id ||
        !formData.batch_number ||
        !formData.quantity_received ||
        !formData.unit_cost ||
        !formData.selling_price ||
        !formData.expiry_date
      ) {
        setErrorMessage("Please fill in all required fields")
        return
      }

      // Create drug batch record
      const { data: batchData, error: batchError } = await supabase
        .from("drug_batches")
        .insert({
          drug_id: formData.drug_id,
          batch_number: formData.batch_number,
          supplier_id: formData.supplier_id,
          quantity_received: parseInt(formData.quantity_received),
          quantity_in_stock: parseInt(formData.quantity_received),
          unit_cost: parseFloat(formData.unit_cost),
          selling_price: parseFloat(formData.selling_price),
          markup_percentage: parseFloat(formData.markup_percentage),
          received_date: formData.received_date,
          expiry_date: formData.expiry_date,
          storage_location: formData.storage_location,
          status: "in_stock",
        })
        .select()

      if (batchError) {
        console.error("Batch error:", batchError)
        setErrorMessage(`Failed to create batch: ${batchError.message}`)
        return
      }

      // Record stock movement
      const { error: movementError } = await supabase
        .from("stock_movements")
        .insert({
          batch_id: batchData[0].id,
          movement_type: "stock_in",
          quantity: parseInt(formData.quantity_received),
          moved_by: (await supabase.auth.getUser()).data.user?.id,
          department: "pharmacy",
          cost_per_unit: parseFloat(formData.unit_cost),
          notes: `Stock received from ${suppliers.find((s) => s.id === formData.supplier_id)?.supplier_name}`,
        })

      if (movementError) {
        console.error("Movement error:", movementError)
        setErrorMessage(`Failed to record movement: ${movementError.message}`)
        return
      }

      setSuccessMessage(
        `Stock added successfully! Batch: ${formData.batch_number}, Quantity: ${formData.quantity_received}`
      )

      // Reset form
      setFormData({
        drug_id: "",
        supplier_id: "",
        batch_number: "",
        quantity_received: "",
        unit_cost: "",
        selling_price: "",
        received_date: new Date().toISOString().split("T")[0],
        expiry_date: "",
        storage_location: "",
        markup_percentage: "30",
      })

      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (error: any) {
      console.error("Error:", error)
      setErrorMessage(error.message || "An error occurred")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Add Stock to Pharmacy</h1>

          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded text-green-700">
              ✅ {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
              ❌ {errorMessage}
            </div>
          )}

          <form onSubmit={handleAddStock} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Drug Selection */}
              <div>
                <label className="block text-sm font-semibold mb-2">Drug *</label>
                <select
                  name="drug_id"
                  value={formData.drug_id}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                >
                  <option value="">Select Drug</option>
                  {drugs.map((drug) => (
                    <option key={drug.id} value={drug.id}>
                      {drug.drug_name} ({drug.generic_name}) - {drug.strength}
                    </option>
                  ))}
                </select>
              </div>

              {/* Supplier Selection */}
              <div>
                <label className="block text-sm font-semibold mb-2">Supplier *</label>
                <select
                  name="supplier_id"
                  value={formData.supplier_id}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.supplier_name} ({supplier.supplier_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch Number */}
              <div>
                <label className="block text-sm font-semibold mb-2">Batch Number *</label>
                <input
                  type="text"
                  name="batch_number"
                  value={formData.batch_number}
                  onChange={handleChange}
                  placeholder="e.g., BATCH001"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-semibold mb-2">Quantity Received *</label>
                <input
                  type="number"
                  name="quantity_received"
                  value={formData.quantity_received}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>

              {/* Unit Cost */}
              <div>
                <label className="block text-sm font-semibold mb-2">Unit Cost (KES) *</label>
                <input
                  type="number"
                  name="unit_cost"
                  value={formData.unit_cost}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>

              {/* Selling Price */}
              <div>
                <label className="block text-sm font-semibold mb-2">Selling Price (KES) *</label>
                <input
                  type="number"
                  name="selling_price"
                  value={formData.selling_price}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>

              {/* Markup Percentage */}
              <div>
                <label className="block text-sm font-semibold mb-2">Markup % (optional)</label>
                <input
                  type="number"
                  name="markup_percentage"
                  value={formData.markup_percentage}
                  onChange={handleChange}
                  placeholder="30"
                  step="0.1"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              {/* Received Date */}
              <div>
                <label className="block text-sm font-semibold mb-2">Received Date *</label>
                <input
                  type="date"
                  name="received_date"
                  value={formData.received_date}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-sm font-semibold mb-2">Expiry Date *</label>
                <input
                  type="date"
                  name="expiry_date"
                  value={formData.expiry_date}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>

              {/* Storage Location */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">Storage Location</label>
                <input
                  type="text"
                  name="storage_location"
                  value={formData.storage_location}
                  onChange={handleChange}
                  placeholder="e.g., Shelf A1, Room 2"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-6 border-t">
              <button
                type="submit"
                disabled={saving || loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition font-semibold"
              >
                {saving ? "Adding Stock..." : "Add Stock"}
              </button>
              <button
                type="reset"
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition"
                onClick={() =>
                  setFormData({
                    drug_id: "",
                    supplier_id: "",
                    batch_number: "",
                    quantity_received: "",
                    unit_cost: "",
                    selling_price: "",
                    received_date: new Date().toISOString().split("T")[0],
                    expiry_date: "",
                    storage_location: "",
                    markup_percentage: "30",
                  })
                }
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
