"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

interface TheatreBill {
  id?: string
  case_id: string
  patient_id: string
  total_amount: number
  surgeon_fee: number
  anesthetist_fee: number
  theatre_charges: number
  consumables_cost: number
  medication_cost: number
  insurance_coverage?: number
  patient_payable: number
  status: 'pending' | 'approved' | 'paid' | 'cancelled'
  created_at?: string
  paid_at?: string
  bill_items: {
    description: string
    quantity: number
    unit_price: number
    total: number
    category: 'surgery' | 'anesthesia' | 'consumables' | 'medication' | 'theatre'
  }[]
}

export default function TheatreBilling() {
  const [cases, setCases] = useState<any[]>([])
  const [selectedCase, setSelectedCase] = useState<any>(null)
  const [bill, setBill] = useState<TheatreBill | null>(null)
  const [loading, setLoading] = useState(true)
  const [showBillForm, setShowBillForm] = useState(false)

  useEffect(() => {
    loadCases()
  }, [])

  const loadCases = async () => {
    setLoading(true)
    // Load completed cases that need billing
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from("theatre_cases")
      .select(`
        *,
        theatre_bookings (
          procedure_name,
          patient_id,
          surgeon_id,
          anesthetist_id,
          urgency
        )
      `)
      .eq("status", "completed")
      .gte("time_in", `${today}T00:00:00`)
      .order("time_in", { ascending: false })

    if (error) {
      console.error("Failed to load cases", error)
    } else {
      setCases(data || [])
    }
    setLoading(false)
  }

  const loadBill = async (caseId: string) => {
    const { data, error } = await supabase
      .from("theatre_bills")
      .select("*")
      .eq("case_id", caseId)
      .single()

    if (error && error.code !== 'PGRST116') { // Not found error
      console.error("Failed to load bill", error)
      return
    }

    if (data) {
      setBill(data)
    } else {
      // Create new bill
      await generateBill(caseId)
    }
  }

  const generateBill = async (caseId: string) => {
    const caseData = selectedCase

    // Get consumables used
    const { data: consumables, error: consError } = await supabase
      .from("theatre_stock_movements")
      .select(`
        *,
        pharmacy_stock (
          medicine_name,
          unit_price
        )
      `)
      .eq("case_id", caseId)
      .eq("movement_type", "used")

    if (consError) {
      console.error("Failed to load consumables", consError)
    }

    // Calculate costs
    const surgeonFee = calculateSurgeonFee(caseData.theatre_bookings.procedure_name, caseData.theatre_bookings.urgency)
    const anesthetistFee = calculateAnesthetistFee(caseData.theatre_bookings.procedure_name)
    const theatreCharges = calculateTheatreCharges(caseData.duration_minutes || 60)
    const consumablesCost = (consumables || []).reduce((sum, item) => sum + (item.quantity * item.pharmacy_stock.unit_price), 0)

    const billItems = [
      {
        description: `${caseData.theatre_bookings.procedure_name} - Surgeon Fee`,
        quantity: 1,
        unit_price: surgeonFee,
        total: surgeonFee,
        category: 'surgery' as const
      },
      {
        description: `${caseData.theatre_bookings.procedure_name} - Anesthetist Fee`,
        quantity: 1,
        unit_price: anesthetistFee,
        total: anesthetistFee,
        category: 'anesthesia' as const
      },
      {
        description: `Theatre Charges (${caseData.duration_minutes || 60} minutes)`,
        quantity: caseData.duration_minutes || 60,
        unit_price: theatreCharges / (caseData.duration_minutes || 60),
        total: theatreCharges,
        category: 'theatre' as const
      }
    ]

    // Add consumables
    ;(consumables || []).forEach(item => {
      billItems.push({
        description: item.pharmacy_stock.medicine_name,
        quantity: item.quantity,
        unit_price: item.pharmacy_stock.unit_price,
        total: item.quantity * item.pharmacy_stock.unit_price,
        category: 'consumables' as const
      })
    })

    const totalAmount = billItems.reduce((sum, item) => sum + item.total, 0)

    const newBill: TheatreBill = {
      case_id: caseId,
      patient_id: caseData.theatre_bookings.patient_id,
      total_amount: totalAmount,
      surgeon_fee: surgeonFee,
      anesthetist_fee: anesthetistFee,
      theatre_charges: theatreCharges,
      consumables_cost: consumablesCost,
      medication_cost: 0, // TODO: calculate from prescriptions
      patient_payable: totalAmount, // TODO: apply insurance
      status: 'pending',
      bill_items: billItems
    }

    setBill(newBill)
  }

  const calculateSurgeonFee = (procedure: string, urgency: string): number => {
    const baseFees: { [key: string]: number } = {
      'Appendectomy': 150000,
      'Cholecystectomy': 200000,
      'Hernia Repair': 120000,
      'Caesarean Section': 180000,
      'Orthopedic Surgery': 250000,
      'General Surgery': 100000
    }

    const baseFee = baseFees[procedure] || 100000
    const urgencyMultiplier = urgency === 'emergency' ? 1.5 : 1.0

    return Math.round(baseFee * urgencyMultiplier)
  }

  const calculateAnesthetistFee = (procedure: string): number => {
    const baseFees: { [key: string]: number } = {
      'Appendectomy': 50000,
      'Cholecystectomy': 75000,
      'Hernia Repair': 40000,
      'Caesarean Section': 60000,
      'Orthopedic Surgery': 80000,
      'General Surgery': 30000
    }

    return baseFees[procedure] || 30000
  }

  const calculateTheatreCharges = (durationMinutes: number): number => {
    const hourlyRate = 50000 // KES per hour
    return Math.round((durationMinutes / 60) * hourlyRate)
  }

  const saveBill = async () => {
    if (!bill) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from("theatre_bills")
        .upsert(bill, { onConflict: 'case_id' })

      if (error) throw error

      alert('Bill saved successfully')
      setShowBillForm(false)
    } catch (error) {
      console.error('Error saving bill:', error)
      alert('Failed to save bill')
    } finally {
      setLoading(false)
    }
  }

  const approveBill = async () => {
    if (!bill) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from("theatre_bills")
        .update({ status: 'approved' })
        .eq("id", bill.id)

      if (error) throw error

      setBill({ ...bill, status: 'approved' })
      alert('Bill approved successfully')
    } catch (error) {
      console.error('Error approving bill:', error)
      alert('Failed to approve bill')
    } finally {
      setLoading(false)
    }
  }

  const markAsPaid = async () => {
    if (!bill) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from("theatre_bills")
        .update({
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq("id", bill.id)

      if (error) throw error

      setBill({ ...bill, status: 'paid', paid_at: new Date().toISOString() })
      alert('Bill marked as paid')
    } catch (error) {
      console.error('Error marking bill as paid:', error)
      alert('Failed to mark bill as paid')
    } finally {
      setLoading(false)
    }
  }

  const addBillItem = () => {
    if (!bill) return

    const newItem = {
      description: '',
      quantity: 1,
      unit_price: 0,
      total: 0,
      category: 'consumables' as const
    }

    setBill({
      ...bill,
      bill_items: [...bill.bill_items, newItem]
    })
  }

  const updateBillItem = (index: number, field: string, value: any) => {
    if (!bill) return

    const updatedItems = [...bill.bill_items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }

    // Recalculate total for the item
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unit_price
    }

    // Recalculate total bill amount
    const totalAmount = updatedItems.reduce((sum, item) => sum + item.total, 0)

    setBill({
      ...bill,
      bill_items: updatedItems,
      total_amount: totalAmount,
      patient_payable: totalAmount // TODO: apply insurance discount
    })
  }

  const removeBillItem = (index: number) => {
    if (!bill) return

    const updatedItems = bill.bill_items.filter((_, i) => i !== index)
    const totalAmount = updatedItems.reduce((sum, item) => sum + item.total, 0)

    setBill({
      ...bill,
      bill_items: updatedItems,
      total_amount: totalAmount,
      patient_payable: totalAmount
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-blue-100 text-blue-800'
      case 'paid': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading && !selectedCase) return <div className="p-6">Loading theatre billing...</div>

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">💰 Theatre Billing - LIFEPOINT HOSPITAL</h1>

        {!selectedCase ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">Select Completed Case for Billing</h2>
            <div className="space-y-4">
              {cases.map(case_ => (
                <div key={case_.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{case_.procedure_performed}</h3>
                      <p className="text-sm text-gray-600">
                        Case ID: {case_.case_id} | Duration: {case_.duration_minutes || 0} min
                      </p>
                      <p className="text-sm text-gray-500">
                        Completed: {case_.time_out ? new Date(case_.time_out).toLocaleString() : 'Not completed'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCase(case_)
                        loadBill(case_.id)
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Generate Bill
                    </button>
                  </div>
                </div>
              ))}
              {cases.length === 0 && (
                <p className="text-center text-gray-500 py-8">No completed cases available for billing</p>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold">{selectedCase.procedure_performed}</h2>
                <p className="text-gray-600">Case ID: {selectedCase.case_id}</p>
                {bill && (
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`px-2 py-1 rounded text-sm ${getStatusColor(bill.status)}`}>
                      {bill.status.toUpperCase()}
                    </span>
                    <span className="text-lg font-semibold text-green-600">
                      Total: KES {bill.total_amount.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-x-2">
                {!showBillForm && (
                  <button
                    onClick={() => setShowBillForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Edit Bill
                  </button>
                )}
                {bill?.status === 'pending' && (
                  <button
                    onClick={approveBill}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Approve Bill
                  </button>
                )}
                {bill?.status === 'approved' && (
                  <button
                    onClick={markAsPaid}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                  >
                    Mark as Paid
                  </button>
                )}
                <button
                  onClick={() => setSelectedCase(null)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Back to Cases
                </button>
              </div>
            </div>

            {bill && (
              <div className="space-y-6">
                {!showBillForm ? (
                  // Bill Display
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Bill Details</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="bg-white p-4 rounded border">
                        <h4 className="font-medium text-gray-600">Surgeon Fee</h4>
                        <p className="text-2xl font-bold text-blue-600">KES {bill.surgeon_fee.toLocaleString()}</p>
                      </div>
                      <div className="bg-white p-4 rounded border">
                        <h4 className="font-medium text-gray-600">Anesthetist Fee</h4>
                        <p className="text-2xl font-bold text-green-600">KES {bill.anesthetist_fee.toLocaleString()}</p>
                      </div>
                      <div className="bg-white p-4 rounded border">
                        <h4 className="font-medium text-gray-600">Theatre Charges</h4>
                        <p className="text-2xl font-bold text-purple-600">KES {bill.theatre_charges.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-2 border text-left">Description</th>
                            <th className="px-4 py-2 border text-center">Qty</th>
                            <th className="px-4 py-2 border text-right">Unit Price</th>
                            <th className="px-4 py-2 border text-right">Total</th>
                            <th className="px-4 py-2 border text-center">Category</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bill.bill_items.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 border">{item.description}</td>
                              <td className="px-4 py-2 border text-center">{item.quantity}</td>
                              <td className="px-4 py-2 border text-right">KES {item.unit_price.toLocaleString()}</td>
                              <td className="px-4 py-2 border text-right font-semibold">KES {item.total.toLocaleString()}</td>
                              <td className="px-4 py-2 border text-center capitalize">{item.category}</td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50 font-bold">
                            <td className="px-4 py-2 border" colSpan={3}>TOTAL</td>
                            <td className="px-4 py-2 border text-right">KES {bill.total_amount.toLocaleString()}</td>
                            <td className="px-4 py-2 border"></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  // Bill Edit Form
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Edit Bill Items</h3>

                    <div className="space-y-4 mb-6">
                      {bill.bill_items.map((item, index) => (
                        <div key={index} className="bg-white p-4 rounded border">
                          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium mb-1">Description</label>
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => updateBillItem(index, 'description', e.target.value)}
                                className="w-full border rounded px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Quantity</label>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateBillItem(index, 'quantity', parseInt(e.target.value))}
                                className="w-full border rounded px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Unit Price</label>
                              <input
                                type="number"
                                value={item.unit_price}
                                onChange={(e) => updateBillItem(index, 'unit_price', parseFloat(e.target.value))}
                                className="w-full border rounded px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Total</label>
                              <input
                                type="number"
                                value={item.total}
                                readOnly
                                className="w-full border rounded px-3 py-2 bg-gray-100"
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <select
                                value={item.category}
                                onChange={(e) => updateBillItem(index, 'category', e.target.value)}
                                className="border rounded px-3 py-2"
                              >
                                <option value="surgery">Surgery</option>
                                <option value="anesthesia">Anesthesia</option>
                                <option value="consumables">Consumables</option>
                                <option value="medication">Medication</option>
                                <option value="theatre">Theatre</option>
                              </select>
                              <button
                                onClick={() => removeBillItem(index)}
                                className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center">
                      <button
                        onClick={addBillItem}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >
                        Add Item
                      </button>

                      <div className="space-x-2">
                        <button
                          onClick={() => setShowBillForm(false)}
                          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveBill}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                          Save Bill
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}