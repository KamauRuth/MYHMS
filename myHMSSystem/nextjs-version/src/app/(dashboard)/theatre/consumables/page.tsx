"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

interface ConsumableRequest {
  id?: string
  case_id: string
  item_name: string
  quantity_requested: number
  urgency: 'routine' | 'urgent' | 'emergency'
  requested_by: string
  status: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  approved_at?: string
}

interface ConsumableUsage {
  id?: string
  case_id: string
  item_type: 'drug' | 'consumable' | 'implant'
  item_name: string
  batch_number?: string
  expiry_date?: string
  quantity_used: number
  unit: string
  cost_per_unit?: number
  total_cost?: number
  pharmacy_stock_deducted: boolean
  recorded_by: string
}

export default function TheatreConsumables() {
  const [activeTab, setActiveTab] = useState<'request' | 'usage' | 'stock'>('request')
  const [cases, setCases] = useState<any[]>([])
  const [selectedCase, setSelectedCase] = useState<any>(null)
  const [requests, setRequests] = useState<ConsumableRequest[]>([])
  const [usages, setUsages] = useState<ConsumableUsage[]>([])
  const [pharmacyStock, setPharmacyStock] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Request form
  const [requestForm, setRequestForm] = useState<ConsumableRequest>({
    case_id: '',
    item_name: '',
    quantity_requested: 1,
    urgency: 'routine',
    requested_by: 'current_user',
    status: 'pending'
  })

  // Usage form
  const [usageForm, setUsageForm] = useState<ConsumableUsage>({
    case_id: '',
    item_type: 'consumable',
    item_name: '',
    quantity_used: 1,
    unit: 'pieces',
    pharmacy_stock_deducted: false,
    recorded_by: 'current_user'
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)

    // Load active surgery cases
    const { data: casesData } = await supabase
      .from("theatre_cases")
      .select(`
        *,
        theatre_bookings (
          procedure_name
        )
      `)
      .in("status", ["prepped", "in_surgery", "recovery"])
      .order("time_in", { ascending: false })

    if (casesData) setCases(casesData)

    // Load pharmacy stock (assuming pharmacy_stock table exists)
    const { data: stockData } = await supabase
      .from("pharmacy_stock")
      .select("*")
      .limit(100)

    if (stockData) setPharmacyStock(stockData)

    setLoading(false)
  }

  const loadRequests = async (caseId: string) => {
    const { data, error } = await supabase
      .from("theatre_stock_movements")
      .select("*")
      .eq("case_id", caseId)
      .eq("movement_type", "request")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setRequests(data.map(req => ({
        id: req.id,
        case_id: req.case_id,
        item_name: req.item_name,
        quantity_requested: req.quantity,
        urgency: req.movement_type === 'request' ? 'routine' : 'routine', // TODO: add urgency field
        requested_by: req.requested_by,
        status: req.movement_type === 'approved' ? 'approved' : 'pending',
        approved_by: req.approved_by,
        approved_at: req.approved_at
      })))
    }
  }

  const loadUsages = async (caseId: string) => {
    const { data, error } = await supabase
      .from("theatre_consumables")
      .select("*")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setUsages(data)
    }
  }

  const submitRequest = async () => {
    setLoading(true)
    try {
      // Check if item exists in pharmacy stock
      const stockItem = pharmacyStock.find(item =>
        item.medicine_name.toLowerCase() === requestForm.item_name.toLowerCase()
      )

      if (!stockItem) {
        alert('Item not found in pharmacy stock. Please check the item name.')
        return
      }

      if (stockItem.current_stock < requestForm.quantity_requested) {
        alert(`Insufficient stock. Available: ${stockItem.current_stock}`)
        return
      }

      // Create stock movement request
      const { error } = await supabase
        .from("theatre_stock_movements")
        .insert([{
          item_name: requestForm.item_name,
          movement_type: 'request',
          quantity: requestForm.quantity_requested,
          case_id: requestForm.case_id,
          requested_by: requestForm.requested_by
        }])

      if (error) throw error

      alert('Consumable request submitted successfully!')
      loadRequests(requestForm.case_id)

      // Reset form
      setRequestForm({
        case_id: requestForm.case_id,
        item_name: '',
        quantity_requested: 1,
        urgency: 'routine',
        requested_by: 'current_user',
        status: 'pending'
      })

    } catch (error) {
      console.error('Error submitting request:', error)
      alert('Failed to submit request')
    } finally {
      setLoading(false)
    }
  }

  const recordUsage = async () => {
    setLoading(true)
    try {
      // Get item details from pharmacy stock
      const stockItem = pharmacyStock.find(item =>
        item.medicine_name.toLowerCase() === usageForm.item_name.toLowerCase()
      )

      if (!stockItem) {
        alert('Item not found in pharmacy stock. Please check the item name.')
        return
      }

      if (stockItem.current_stock < usageForm.quantity_used) {
        alert(`Insufficient stock. Available: ${stockItem.current_stock}`)
        return
      }

      // Calculate cost
      const costPerUnit = stockItem.selling_price || 0
      const totalCost = costPerUnit * usageForm.quantity_used

      // Record usage
      const usageData = {
        ...usageForm,
        cost_per_unit: costPerUnit,
        total_cost: totalCost
      }

      const { error: usageError } = await supabase
        .from("theatre_consumables")
        .insert([usageData])

      if (usageError) throw usageError

      // Deduct from pharmacy stock
      const { error: stockError } = await supabase
        .from("pharmacy_stock")
        .update({
          current_stock: stockItem.current_stock - usageForm.quantity_used
        })
        .eq("id", stockItem.id)

      if (stockError) throw stockError

      // Update usage record to mark stock deducted
      const { error: updateError } = await supabase
        .from("theatre_consumables")
        .update({ pharmacy_stock_deducted: true })
        .eq("case_id", usageForm.case_id)
        .eq("item_name", usageForm.item_name)
        .order("created_at", { ascending: false })
        .limit(1)

      if (updateError) console.error('Error updating deduction flag:', updateError)

      alert('Consumable usage recorded and stock deducted!')
      loadUsages(usageForm.case_id)

      // Reset form
      setUsageForm({
        case_id: usageForm.case_id,
        item_type: 'consumable',
        item_name: '',
        quantity_used: 1,
        unit: 'pieces',
        pharmacy_stock_deducted: false,
        recorded_by: 'current_user'
      })

    } catch (error) {
      console.error('Error recording usage:', error)
      alert('Failed to record usage')
    } finally {
      setLoading(false)
    }
  }

  const approveRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("theatre_stock_movements")
        .update({
          movement_type: 'approved',
          approved_by: 'current_user', // TODO: get from auth
          approved_at: new Date().toISOString()
        })
        .eq("id", requestId)

      if (error) throw error

      alert('Request approved!')
      if (selectedCase) loadRequests(selectedCase.id)

    } catch (error) {
      console.error('Error approving request:', error)
      alert('Failed to approve request')
    }
  }

  const renderRequestForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Item Name</label>
          <select
            value={requestForm.item_name}
            onChange={(e) => setRequestForm({...requestForm, item_name: e.target.value})}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select from Pharmacy Stock</option>
            {pharmacyStock.map(item => (
              <option key={item.id} value={item.medicine_name}>
                {item.medicine_name} (Available: {item.current_stock})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Quantity Requested</label>
          <input
            type="number"
            min="1"
            value={requestForm.quantity_requested}
            onChange={(e) => setRequestForm({...requestForm, quantity_requested: parseInt(e.target.value)})}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Urgency</label>
        <select
          value={requestForm.urgency}
          onChange={(e) => setRequestForm({...requestForm, urgency: e.target.value as 'routine' | 'urgent' | 'emergency'})}
          className="w-full border rounded px-3 py-2"
        >
          <option value="routine">Routine</option>
          <option value="urgent">Urgent</option>
          <option value="emergency">Emergency</option>
        </select>
      </div>

      <div className="flex justify-end">
        <button
          onClick={submitRequest}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </div>
    </div>
  )

  const renderUsageForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Item Type</label>
          <select
            value={usageForm.item_type}
            onChange={(e) => setUsageForm({...usageForm, item_type: e.target.value as 'drug' | 'consumable' | 'implant'})}
            className="w-full border rounded px-3 py-2"
          >
            <option value="drug">Drug</option>
            <option value="consumable">Consumable</option>
            <option value="implant">Implant</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Item Name</label>
          <select
            value={usageForm.item_name}
            onChange={(e) => setUsageForm({...usageForm, item_name: e.target.value})}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select from Pharmacy Stock</option>
            {pharmacyStock.map(item => (
              <option key={item.id} value={item.medicine_name}>
                {item.medicine_name} (Available: {item.current_stock})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Quantity Used</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={usageForm.quantity_used}
            onChange={(e) => setUsageForm({...usageForm, quantity_used: parseFloat(e.target.value)})}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Unit</label>
          <select
            value={usageForm.unit}
            onChange={(e) => setUsageForm({...usageForm, unit: e.target.value})}
            className="w-full border rounded px-3 py-2"
          >
            <option value="pieces">Pieces</option>
            <option value="ml">ml</option>
            <option value="mg">mg</option>
            <option value="units">Units</option>
            <option value="vials">Vials</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Batch Number (Optional)</label>
          <input
            type="text"
            value={usageForm.batch_number || ''}
            onChange={(e) => setUsageForm({...usageForm, batch_number: e.target.value})}
            className="w-full border rounded px-3 py-2"
            placeholder="Batch number"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={recordUsage}
          disabled={loading}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Recording...' : 'Record Usage & Deduct Stock'}
        </button>
      </div>
    </div>
  )

  const renderRequestsList = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Consumable Requests</h3>
      {requests.map(request => (
        <div key={request.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold">{request.item_name}</h4>
              <p className="text-sm text-gray-600">
                Quantity: {request.quantity_requested} | Urgency: {request.urgency}
              </p>
              <p className="text-sm text-gray-500">
                Status: <span className={`px-2 py-1 rounded text-xs ${
                  request.status === 'approved' ? 'bg-green-100 text-green-800' :
                  request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>{request.status}</span>
              </p>
            </div>
            {request.status === 'pending' && (
              <button
                onClick={() => approveRequest(request.id!)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Approve
              </button>
            )}
          </div>
        </div>
      ))}
      {requests.length === 0 && (
        <p className="text-center text-gray-500 py-8">No consumable requests for this case</p>
      )}
    </div>
  )

  const renderUsagesList = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Consumable Usage</h3>
      {usages.map(usage => (
        <div key={usage.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold">{usage.item_name}</h4>
              <p className="text-sm text-gray-600">
                Type: {usage.item_type} | Quantity: {usage.quantity_used} {usage.unit}
              </p>
              {usage.total_cost && (
                <p className="text-sm text-gray-600">
                  Cost: ${usage.total_cost.toFixed(2)}
                </p>
              )}
              <p className="text-sm text-gray-500">
                Stock Deducted: {usage.pharmacy_stock_deducted ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </div>
      ))}
      {usages.length === 0 && (
        <p className="text-center text-gray-500 py-8">No consumables recorded for this case</p>
      )}
    </div>
  )

  if (loading && !selectedCase) return <div className="p-6">Loading theatre consumables...</div>

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">📦 Theatre Consumables Management - LIFEPOINT HOSPITAL</h1>

        {!selectedCase ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">Select Surgery Case</h2>
            <div className="space-y-4">
              {cases.map(case_ => (
                <div key={case_.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{case_.procedure_performed}</h3>
                      <p className="text-sm text-gray-600">
                        Case ID: {case_.case_id} | Status: {case_.status.replace('_', ' ').toUpperCase()}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCase(case_)
                        setRequestForm({...requestForm, case_id: case_.id})
                        setUsageForm({...usageForm, case_id: case_.id})
                        loadRequests(case_.id)
                        loadUsages(case_.id)
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Manage Consumables
                    </button>
                  </div>
                </div>
              ))}
              {cases.length === 0 && (
                <p className="text-center text-gray-500 py-8">No active surgery cases</p>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold">{selectedCase.procedure_performed}</h2>
                <p className="text-gray-600">Case ID: {selectedCase.case_id}</p>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Back to Cases
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6">
              {[
                { key: 'request', label: 'Request Consumables' },
                { key: 'usage', label: 'Record Usage' },
                { key: 'stock', label: 'View Requests & Usage' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-4 py-2 rounded-t-lg ${
                    activeTab === tab.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="bg-gray-50 p-6 rounded-lg">
              {activeTab === 'request' && renderRequestForm()}
              {activeTab === 'usage' && renderUsageForm()}
              {activeTab === 'stock' && (
                <div className="space-y-8">
                  {renderRequestsList()}
                  <hr />
                  {renderUsagesList()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}