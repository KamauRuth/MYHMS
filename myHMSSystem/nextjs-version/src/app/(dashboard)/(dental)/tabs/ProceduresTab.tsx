"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { generateBillingForDentalAction } from "@/app/actions/billingActions"

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

interface DentalProcedureRecord {
  id: string
  procedure_id: string
  tooth_number: string
  tooth_surface: string
  status: string
  cost: number
  procedure?: Procedure
}

export default function ProceduresTab({ visit }: { visit: any }) {
  const [availableProcedures, setAvailableProcedures] = useState<Procedure[]>([])
  const [recordedProcedures, setRecordedProcedures] = useState<DentalProcedureRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProcedure, setSelectedProcedure] = useState("")
  const [toothNumber, setToothNumber] = useState("")
  const [toothSurface, setToothSurface] = useState("occlusal")
  const [status, setStatus] = useState("completed")
  const [filterCategory, setFilterCategory] = useState("All")
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetchProcedures()
    fetchRecordedProcedures()
  }, [visit?.id])

  const fetchProcedures = async () => {
    try {
      const { data, error } = await supabase
        .from("procedure_master")
        .select("*")
        .order("category")

      if (error) throw error
      setAvailableProcedures(data || [])
    } catch (err) {
      console.error("Error fetching procedures:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecordedProcedures = async () => {
    try {
      const { data, error } = await supabase
        .from("dental_procedures")
        .select(`
          id,
          procedure_id,
          tooth_number,
          tooth_surface,
          status,
          cost,
          procedure_master(id, name, category, price, duration_minutes, requires_anesthesia)
        `)
        .eq("dental_visit_id", visit?.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setRecordedProcedures(data || [])
    } catch (err) {
      console.error("Error fetching recorded procedures:", err)
    }
  }

  const handleAddProcedure = async () => {
    if (!selectedProcedure) {
      alert("Please select a procedure")
      return
    }

    setAdding(true)
    try {
      const procedure = availableProcedures.find(p => p.id === selectedProcedure)
      if (!procedure) throw new Error("Procedure not found")

      // 1️⃣ Record the procedure
      const { data: newRecord, error: recordError } = await supabase
        .from("dental_procedures")
        .insert({
          dental_visit_id: visit.id,
          procedure_id: selectedProcedure,
          tooth_number: toothNumber || null,
          tooth_surface: toothSurface,
          status: status,
          cost: procedure.price,
          completed_at: status === "completed" ? new Date().toISOString() : null
        })
        .select()
        .single()

      if (recordError) throw recordError

      // 2️⃣ Silently create billing (non-blocking)
      try {
        await generateBillingForDentalAction(visit.id, procedure.price, procedure.name)
      } catch (billingErr) {
        console.error("Billing error (non-blocking):", billingErr)
        // Don't fail procedure recording if billing fails
      }

      alert(`✅ Procedure added: ${procedure.name}`)
      resetForm()
      fetchRecordedProcedures()
    } catch (err: any) {
      console.error("Error adding procedure:", err)
      alert(`Failed: ${err.message}`)
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteProcedure = async (id: string) => {
    if (!confirm("Delete this procedure record?")) return

    try {
      const { error } = await supabase
        .from("dental_procedures")
        .delete()
        .eq("id", id)

      if (error) throw error
      alert("✅ Procedure deleted")
      fetchRecordedProcedures()
    } catch (err: any) {
      console.error("Error deleting:", err)
      alert(`Failed: ${err.message}`)
    }
  }

  const resetForm = () => {
    setSelectedProcedure("")
    setToothNumber("")
    setToothSurface("occlusal")
    setStatus("completed")
  }

  const categories = ["All", ...new Set(availableProcedures.map(p => p.category))]

  const filteredProcedures = availableProcedures.filter(p =>
    filterCategory === "All" || p.category === filterCategory
  )

  if (loading) return <div className="p-4 text-center text-gray-500">Loading procedures...</div>

  return (
    <div className="space-y-6">
      {/* Add Procedure Form */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-lg text-gray-800 mb-4">Add Procedure</h3>

        <div className="space-y-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 outline-none"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Procedure Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Procedure *</label>
            <select
              value={selectedProcedure}
              onChange={(e) => setSelectedProcedure(e.target.value)}
              className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 outline-none"
            >
              <option value="">Select Procedure</option>
              {filteredProcedures.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} - KES {p.price.toLocaleString()} ({p.duration_minutes} min)
                </option>
              ))}
            </select>
          </div>

          {/* Tooth Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tooth Number</label>
              <input
                type="text"
                placeholder="e.g., 16, 32"
                value={toothNumber}
                onChange={(e) => setToothNumber(e.target.value)}
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Surface</label>
              <select
                value={toothSurface}
                onChange={(e) => setToothSurface(e.target.value)}
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 outline-none"
              >
                <option value="occlusal">Occlusal</option>
                <option value="facial">Facial</option>
                <option value="lingual">Lingual</option>
                <option value="mesial">Mesial</option>
                <option value="distal">Distal</option>
                <option value="incisal">Incisal</option>
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 outline-none"
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <button
            onClick={handleAddProcedure}
            disabled={adding}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-medium"
          >
            {adding ? "Adding..." : "+ Add Procedure"}
          </button>
        </div>
      </div>

      {/* Recorded Procedures */}
      <div>
        <h3 className="font-semibold text-lg text-gray-800 mb-3">
          Procedures Recorded ({recordedProcedures.length})
        </h3>

        {recordedProcedures.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            No procedures recorded yet
          </div>
        ) : (
          <div className="space-y-3">
            {recordedProcedures.map(record => (
              <div key={record.id} className="bg-white border rounded-lg p-4 flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium text-gray-800">
                    {record.procedure_master?.name || "Unknown Procedure"}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {record.tooth_number && `Tooth: ${record.tooth_number}`}
                    {record.tooth_surface && ` • Surface: ${record.tooth_surface}`}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      record.status === 'completed' ? 'bg-green-100 text-green-700' :
                      record.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                      record.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {record.status}
                    </span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-lg font-semibold text-gray-800">
                    KES {record.cost?.toLocaleString()}
                  </div>
                  <button
                    onClick={() => handleDeleteProcedure(record.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium mt-2"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}