"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    supplier_name: "",
    supplier_code: "",
    contact_person: "",
    phone: "",
    email: "",
    city: "",
    payment_terms: "net_30",
  })

  useEffect(() => {
    loadSuppliers()
  }, [])

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("is_active", true)
        .order("supplier_name")

      if (error) {
        console.error("Failed to load suppliers:", error)
      } else {
        setSuppliers(data || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { error } = await supabase.from("suppliers").insert({
        ...formData,
        is_active: true,
      })

      if (error) {
        alert(`Failed to add supplier: ${error.message}`)
      } else {
        alert("Supplier added successfully")
        setFormData({
          supplier_name: "",
          supplier_code: "",
          contact_person: "",
          phone: "",
          email: "",
          city: "",
          payment_terms: "net_30",
        })
        setShowForm(false)
        loadSuppliers()
      }
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <h1 className="text-2xl font-bold">Supplier Management</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            {showForm ? "Cancel" : "+ Add Supplier"}
          </button>
        </div>

        {/* Add Supplier Form */}
        {showForm && (
          <div className="p-6 bg-gray-50 border-b">
            <h2 className="font-bold mb-4">Add New Supplier</h2>
            <form onSubmit={handleAddSupplier} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Supplier Name *</label>
                <input
                  type="text"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Supplier Code *</label>
                <input
                  type="text"
                  value={formData.supplier_code}
                  onChange={(e) => setFormData({ ...formData, supplier_code: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                  placeholder="e.g., SUPP001"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Contact Person</label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">Payment Terms</label>
                <select
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="net_30">Net 30</option>
                  <option value="net_45">Net 45</option>
                  <option value="net_60">Net 60</option>
                  <option value="cod">Cash on Delivery</option>
                </select>
              </div>
              <div className="md:col-span-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  Add Supplier
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Suppliers List */}
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading suppliers...</div>
        ) : suppliers.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No suppliers found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {suppliers.map((supplier) => (
              <div key={supplier.id} className="border rounded-lg p-4 hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-gray-800">{supplier.supplier_name}</h3>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {supplier.supplier_code}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  {supplier.contact_person && (
                    <p>
                      <span className="text-gray-600">Contact:</span> {supplier.contact_person}
                    </p>
                  )}
                  <p>
                    <span className="text-gray-600">Phone:</span> {supplier.phone}
                  </p>
                  {supplier.email && (
                    <p>
                      <span className="text-gray-600">Email:</span> {supplier.email}
                    </p>
                  )}
                  {supplier.city && (
                    <p>
                      <span className="text-gray-600">City:</span> {supplier.city}
                    </p>
                  )}
                  <p>
                    <span className="text-gray-600">Payment Terms:</span> {supplier.payment_terms.replace("_", " ").toUpperCase()}
                  </p>
                </div>

                {/* Payment Status */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Outstanding Balance:</span>
                    <span className="font-bold text-red-600">
                      KES {(supplier.outstanding_balance || 0).toLocaleString()}
                    </span>
                  </div>
                  <button className="w-full bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition">
                    Record Payment
                  </button>
                </div>

                {/* Rating */}
                {supplier.rating && (
                  <div className="mt-3 text-center">
                    <p className="text-xs text-gray-600">
                      Rating: <span className="font-semibold">{supplier.rating}/5 ⭐</span>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
