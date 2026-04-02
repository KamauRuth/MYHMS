"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function StockLevelsPage() {
  const [batches, setBatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [sortBy, setSortBy] = useState("expiry")

  useEffect(() => {
    loadStockLevels()
  }, [filter, sortBy])

  const loadStockLevels = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from("drug_batches")
        .select(
          `
          id,
          batch_number,
          quantity_in_stock,
          quantity_received,
          expiry_date,
          status,
          storage_location,
          received_date,
          drugs (id, drug_name, generic_name, strength, reorder_level),
          suppliers (supplier_name)
        `
        )

      // Apply filter
      if (filter === "low_stock") {
        query = query.lt("quantity_in_stock", "reorder_level")
      } else if (filter === "expired") {
        query = query.lt("expiry_date", new Date().toISOString().split("T")[0])
      } else if (filter === "expiring_soon") {
        const thirtyDaysFromNow = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)
        query = query
          .lt("expiry_date", thirtyDaysFromNow.toISOString().split("T")[0])
          .gt("expiry_date", new Date().toISOString().split("T")[0])
      }

      // Apply sorting
      if (sortBy === "expiry") {
        query = query.order("expiry_date", { ascending: true })
      } else if (sortBy === "quantity") {
        query = query.order("quantity_in_stock", { ascending: true })
      } else if (sortBy === "drug") {
        query = query.order("drug_name", { ascending: true })
      }

      const { data, error } = await query

      if (error) {
        console.error("Failed to load stock levels:", error)
      } else {
        setBatches(data || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (batch: any) => {
    if (batch.expiry_date < new Date().toISOString().split("T")[0]) {
      return "bg-red-100 text-red-800"
    }
    const thirtyDaysFromNow = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)
    if (batch.expiry_date < thirtyDaysFromNow.toISOString().split("T")[0]) {
      return "bg-orange-100 text-orange-800"
    }
    if (batch.quantity_in_stock < batch.drugs?.reorder_level) {
      return "bg-yellow-100 text-yellow-800"
    }
    return "bg-green-100 text-green-800"
  }

  const getStatusLabel = (batch: any) => {
    if (batch.expiry_date < new Date().toISOString().split("T")[0]) {
      return "EXPIRED"
    }
    const thirtyDaysFromNow = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)
    if (batch.expiry_date < thirtyDaysFromNow.toISOString().split("T")[0]) {
      return "EXPIRING SOON"
    }
    if (batch.quantity_in_stock < batch.drugs?.reorder_level) {
      return "LOW STOCK"
    }
    return "OK"
  }

  const daysUntilExpiry = (expiryDate: string) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold mb-4">Stock Levels & Inventory</h1>

          {/* Total Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded border border-blue-200">
              <p className="text-sm text-gray-600">Total Drug Batches</p>
              <p className="text-2xl font-bold text-blue-600">{batches.length}</p>
            </div>
            <div className="bg-red-50 p-4 rounded border border-red-200">
              <p className="text-sm text-gray-600">Expired</p>
              <p className="text-2xl font-bold text-red-600">
                {batches.filter((b) => b.expiry_date < new Date().toISOString().split("T")[0]).length}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded border border-orange-200">
              <p className="text-sm text-gray-600">Expiring Soon (30 days)</p>
              <p className="text-2xl font-bold text-orange-600">
                {batches.filter((b) => {
                  const d = daysUntilExpiry(b.expiry_date)
                  return d > 0 && d <= 30
                }).length}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">
                {batches.filter((b) => b.quantity_in_stock < b.drugs?.reorder_level).length}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap mb-4">
            {["all", "low_stock", "expiring_soon", "expired"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded transition ${
                  filter === f
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {f.replace("_", " ").toUpperCase()}
              </button>
            ))}
          </div>

          {/* Sort Options */}
          <div className="flex gap-2 items-center">
            <label className="text-sm font-semibold">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
            >
              <option value="expiry">Expiry Date</option>
              <option value="quantity">Low Stock First</option>
              <option value="drug">Drug Name</option>
            </select>
          </div>
        </div>

        {/* Stock List */}
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading stock levels...</div>
        ) : batches.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No stock records found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Drug Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Batch Number</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Current Stock</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Reorder Level</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Expiry Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Days Left</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Supplier</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3">
                      <div>
                        <p className="font-semibold">{batch.drugs?.drug_name}</p>
                        <p className="text-xs text-gray-600">{batch.drugs?.strength}</p>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm">{batch.batch_number}</td>
                    <td className="px-6 py-3 text-sm font-semibold">
                      {batch.quantity_in_stock} {batch.quantity_in_stock < batch.drugs?.reorder_level && "⚠️"}
                    </td>
                    <td className="px-6 py-3 text-sm">{batch.drugs?.reorder_level}</td>
                    <td className="px-6 py-3 text-sm">
                      {new Date(batch.expiry_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      {batch.expiry_date < new Date().toISOString().split("T")[0] ? (
                        <span className="text-red-600 font-semibold">EXPIRED</span>
                      ) : (
                        `${daysUntilExpiry(batch.expiry_date)} days`
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusColor(batch)}`}>
                        {getStatusLabel(batch)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">{batch.suppliers?.supplier_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
