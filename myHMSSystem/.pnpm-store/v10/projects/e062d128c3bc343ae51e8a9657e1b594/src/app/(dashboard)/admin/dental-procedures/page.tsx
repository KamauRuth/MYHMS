"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

interface Procedure {
  id: string
  name: string
  category: string
  price: number
  duration_minutes: number
  requires_anesthesia: boolean
  description: string
}

export default function DentalProceduresAdmin() {
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    category: "General",
    price: "",
    duration_minutes: "30",
    requires_anesthesia: false,
    description: ""
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("All")

  useEffect(() => {
    fetchProcedures()
  }, [])

  const fetchProcedures = async () => {
    try {
      const { data, error } = await supabase
        .from("procedure_master")
        .select("*")
        .order("name")

      if (error) throw error
      setProcedures(data || [])
    } catch (err) {
      console.error("Error fetching procedures:", err)
      alert("Failed to load procedures")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.price) {
      alert("Please fill in all required fields")
      return
    }

    try {
      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from("procedure_master")
          .update({
            name: formData.name,
            category: formData.category,
            price: parseFloat(formData.price),
            duration_minutes: parseInt(formData.duration_minutes),
            requires_anesthesia: formData.requires_anesthesia,
            description: formData.description,
            updated_at: new Date().toISOString()
          })
          .eq("id", editingId)

        if (error) throw error
        alert("✅ Procedure updated successfully")
      } else {
        // Create new
        const { error } = await supabase
          .from("procedure_master")
          .insert({
            name: formData.name,
            category: formData.category,
            price: parseFloat(formData.price),
            duration_minutes: parseInt(formData.duration_minutes),
            requires_anesthesia: formData.requires_anesthesia,
            description: formData.description
          })

        if (error) throw error
        alert("✅ Procedure added successfully")
      }

      resetForm()
      fetchProcedures()
    } catch (err: any) {
      console.error("Error saving procedure:", err)
      alert(`Failed to save: ${err.message}`)
    }
  }

  const handleEdit = (proc: Procedure) => {
    setFormData({
      name: proc.name,
      category: proc.category,
      price: proc.price.toString(),
      duration_minutes: proc.duration_minutes.toString(),
      requires_anesthesia: proc.requires_anesthesia,
      description: proc.description
    })
    setEditingId(proc.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this procedure?")) return

    try {
      const { error } = await supabase
        .from("procedure_master")
        .delete()
        .eq("id", id)

      if (error) throw error
      alert("✅ Procedure deleted successfully")
      fetchProcedures()
    } catch (err: any) {
      console.error("Error deleting procedure:", err)
      alert(`Failed to delete: ${err.message}`)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      category: "General",
      price: "",
      duration_minutes: "30",
      requires_anesthesia: false,
      description: ""
    })
    setEditingId(null)
    setShowForm(false)
  }

  const categories = ["All", "General", "Endodontics", "Oral Surgery", "Prostho", "Perio", "Ortho"]

  const filteredProcedures = procedures.filter(proc => {
    const matchesSearch = proc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proc.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "All" || proc.category === filterCategory
    return matchesSearch && matchesCategory
  })

  if (loading) return <div className="p-8 text-center">Loading...</div>

  return (
    <div className="max-w-6xl mx-auto p-8 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dental Procedures Management</h1>
        <p className="text-gray-600">Manage dental procedures and pricing</p>
      </div>

      {/* Controls */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <input
          type="text"
          placeholder="Search procedures..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
        />

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          + Add New Procedure
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              {editingId ? "Edit Procedure" : "Add New Procedure"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Procedure Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="border rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-blue-400 outline-none"
                  placeholder="e.g., Root Canal Therapy"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="border rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-blue-400 outline-none"
                  >
                    <option value="General">General</option>
                    <option value="Endodontics">Endodontics</option>
                    <option value="Oral Surgery">Oral Surgery</option>
                    <option value="Prostho">Prostho</option>
                    <option value="Perio">Perio</option>
                    <option value="Ortho">Ortho</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (KES) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="border rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-blue-400 outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                    className="border rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requires_anesthesia}
                      onChange={(e) => setFormData({ ...formData, requires_anesthesia: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700">Requires Anesthesia</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="border rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-blue-400 outline-none min-h-[100px]"
                  placeholder="Procedure description..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  {editingId ? "Update" : "Add"} Procedure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Procedures Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="px-4 py-3 text-left font-semibold text-gray-800">Procedure Name</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-800">Category</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-800">Price (KES)</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-800">Duration</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-800">Anesthesia</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-800">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProcedures.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No procedures found
                </td>
              </tr>
            ) : (
              filteredProcedures.map((proc) => (
                <tr key={proc.id} className="border-b border-gray-200 hover:bg-blue-50 transition">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{proc.name}</div>
                    {proc.description && (
                      <div className="text-sm text-gray-500 mt-1">{proc.description.substring(0, 50)}...</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {proc.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">
                    KES {proc.price.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {proc.duration_minutes} min
                  </td>
                  <td className="px-4 py-3 text-center">
                    {proc.requires_anesthesia ? (
                      <span className="text-green-600 font-medium">Yes</span>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center space-x-2">
                    <button
                      onClick={() => handleEdit(proc)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(proc.id)}
                      className="text-red-600 hover:text-red-800 font-medium text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Stats */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-gray-700">
          <span className="font-semibold">{filteredProcedures.length}</span> procedures found
          {filterCategory !== "All" && ` in ${filterCategory}`}
        </p>
      </div>
    </div>
  )
}
