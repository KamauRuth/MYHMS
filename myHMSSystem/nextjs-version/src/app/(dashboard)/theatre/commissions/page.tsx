"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

interface CommissionRecord {
  id?: string
  doctor_id: string
  doctor_name: string
  case_id: string
  procedure_name: string
  commission_amount: number
  commission_percentage: number
  total_fee: number
  payment_status: 'pending' | 'paid' | 'cancelled'
  commission_date: string
  paid_at?: string
  payment_reference?: string
}

export default function DoctorCommissions() {
  const [commissions, setCommissions] = useState<CommissionRecord[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7))
  const [loading, setLoading] = useState(true)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([])

  useEffect(() => {
    loadDoctors()
    loadCommissions()
  }, [selectedMonth])

  const loadDoctors = async () => {
    // Load surgeons and anesthetists
    const { data, error } = await supabase
      .from("staff")
      .select("id, first_name, last_name, role")
      .in("role", ["surgeon", "anesthetist"])

    if (error) {
      console.error("Failed to load doctors", error)
    } else {
      setDoctors(data || [])
    }
  }

  const loadCommissions = async () => {
    setLoading(true)

    let query = supabase
      .from("theatre_commissions")
      .select(`
        *,
        theatre_cases (
          procedure_performed,
          theatre_bookings (
            procedure_name
          )
        )
      `)
      .gte("commission_date", `${selectedMonth}-01`)
      .lt("commission_date", `${selectedMonth}-32`) // Handle month end

    if (selectedDoctor) {
      query = query.eq("doctor_id", selectedDoctor)
    }

    const { data, error } = await query.order("commission_date", { ascending: false })

    if (error) {
      console.error("Failed to load commissions", error)
    } else {
      setCommissions(data || [])
    }
    setLoading(false)
  }

  const generateCommissions = async () => {
    setLoading(true)

    // Get paid theatre bills for the selected month
    const startDate = `${selectedMonth}-01`
    const endDate = new Date(selectedMonth + '-01')
    endDate.setMonth(endDate.getMonth() + 1)
    const endDateStr = endDate.toISOString().slice(0, 10)

    const { data: bills, error: billError } = await supabase
      .from("theatre_bills")
      .select(`
        *,
        theatre_cases (
          case_id,
          theatre_bookings (
            surgeon_id,
            anesthetist_id,
            procedure_name
          )
        )
      `)
      .eq("status", "paid")
      .gte("paid_at", startDate)
      .lt("paid_at", endDateStr)

    if (billError) {
      console.error("Failed to load bills", billError)
      setLoading(false)
      return
    }

    // Generate commission records
    const commissionRecords: CommissionRecord[] = []

    for (const bill of bills || []) {
      const caseData = bill.theatre_cases
      const booking = caseData.theatre_bookings

      // Surgeon commission (30% of surgeon fee)
      if (booking.surgeon_id) {
        const surgeonCommission = bill.surgeon_fee * 0.3
        commissionRecords.push({
          doctor_id: booking.surgeon_id,
          doctor_name: await getDoctorName(booking.surgeon_id),
          case_id: caseData.case_id,
          procedure_name: booking.procedure_name,
          commission_amount: surgeonCommission,
          commission_percentage: 30,
          total_fee: bill.surgeon_fee,
          payment_status: 'pending',
          commission_date: bill.paid_at!.slice(0, 10)
        })
      }

      // Anesthetist commission (25% of anesthetist fee)
      if (booking.anesthetist_id) {
        const anesthetistCommission = bill.anesthetist_fee * 0.25
        commissionRecords.push({
          doctor_id: booking.anesthetist_id,
          doctor_name: await getDoctorName(booking.anesthetist_id),
          case_id: caseData.case_id,
          procedure_name: booking.procedure_name,
          commission_amount: anesthetistCommission,
          commission_percentage: 25,
          total_fee: bill.anesthetist_fee,
          payment_status: 'pending',
          commission_date: bill.paid_at!.slice(0, 10)
        })
      }
    }

    // Insert commission records
    if (commissionRecords.length > 0) {
      const { error: insertError } = await supabase
        .from("theatre_commissions")
        .insert(commissionRecords)

      if (insertError) {
        console.error("Failed to insert commissions", insertError)
        alert("Failed to generate commissions")
      } else {
        alert(`Generated ${commissionRecords.length} commission records`)
        loadCommissions()
      }
    } else {
      alert("No new commissions to generate")
    }

    setLoading(false)
  }

  const getDoctorName = async (doctorId: string): Promise<string> => {
    const doctor = doctors.find(d => d.id === doctorId)
    if (doctor) {
      return `${doctor.first_name} ${doctor.last_name}`
    }

    // Fetch from database if not in cache
    const { data, error } = await supabase
      .from("staff")
      .select("first_name, last_name")
      .eq("id", doctorId)
      .single()

    if (error) return "Unknown Doctor"
    return `${data.first_name} ${data.last_name}`
  }

  const processPayments = async () => {
    if (selectedCommissions.length === 0) return

    setLoading(true)
    try {
      const paymentReference = `PAY-${Date.now()}`
      const paidAt = new Date().toISOString()

      const { error } = await supabase
        .from("theatre_commissions")
        .update({
          payment_status: 'paid',
          paid_at: paidAt,
          payment_reference: paymentReference
        })
        .in("id", selectedCommissions)

      if (error) throw error

      alert(`Processed payments for ${selectedCommissions.length} commissions`)
      setSelectedCommissions([])
      loadCommissions()
    } catch (error) {
      console.error('Error processing payments:', error)
      alert('Failed to process payments')
    } finally {
      setLoading(false)
    }
  }

  const getTotalCommissions = () => {
    return commissions.reduce((sum, comm) => sum + comm.commission_amount, 0)
  }

  const getPendingCommissions = () => {
    return commissions
      .filter(comm => comm.payment_status === 'pending')
      .reduce((sum, comm) => sum + comm.commission_amount, 0)
  }

  const getPaidCommissions = () => {
    return commissions
      .filter(comm => comm.payment_status === 'paid')
      .reduce((sum, comm) => sum + comm.commission_amount, 0)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'paid': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) return <div className="p-6">Loading doctor commissions...</div>

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">💼 Doctor Commissions - LIFEPOINT HOSPITAL</h1>

        {/* Filters and Actions */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Doctor</label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="">All Doctors</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.first_name} {doctor.last_name} ({doctor.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Month</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border rounded px-3 py-2"
            />
          </div>

          <div className="flex items-end space-x-2">
            <button
              onClick={loadCommissions}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Filter
            </button>
            <button
              onClick={generateCommissions}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Generate Commissions
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border">
            <h3 className="text-sm font-medium text-blue-600">Total Commissions</h3>
            <p className="text-2xl font-bold text-blue-800">KES {getTotalCommissions().toLocaleString()}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border">
            <h3 className="text-sm font-medium text-yellow-600">Pending Payment</h3>
            <p className="text-2xl font-bold text-yellow-800">KES {getPendingCommissions().toLocaleString()}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border">
            <h3 className="text-sm font-medium text-green-600">Paid</h3>
            <p className="text-2xl font-bold text-green-800">KES {getPaidCommissions().toLocaleString()}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border">
            <h3 className="text-sm font-medium text-purple-600">Commission Records</h3>
            <p className="text-2xl font-bold text-purple-800">{commissions.length}</p>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedCommissions.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-800">
                {selectedCommissions.length} commission(s) selected
              </span>
              <button
                onClick={processPayments}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Process Payments
              </button>
            </div>
          </div>
        )}

        {/* Commissions Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 border">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCommissions(commissions.filter(c => c.payment_status === 'pending').map(c => c.id!))
                      } else {
                        setSelectedCommissions([])
                      }
                    }}
                    className="w-4 h-4"
                  />
                </th>
                <th className="px-4 py-2 border text-left">Doctor</th>
                <th className="px-4 py-2 border text-left">Case ID</th>
                <th className="px-4 py-2 border text-left">Procedure</th>
                <th className="px-4 py-2 border text-right">Total Fee</th>
                <th className="px-4 py-2 border text-center">Commission %</th>
                <th className="px-4 py-2 border text-right">Commission Amount</th>
                <th className="px-4 py-2 border text-center">Status</th>
                <th className="px-4 py-2 border text-center">Date</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map(comm => (
                <tr key={comm.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border text-center">
                    {comm.payment_status === 'pending' && (
                      <input
                        type="checkbox"
                        checked={selectedCommissions.includes(comm.id!)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCommissions([...selectedCommissions, comm.id!])
                          } else {
                            setSelectedCommissions(selectedCommissions.filter(id => id !== comm.id))
                          }
                        }}
                        className="w-4 h-4"
                      />
                    )}
                  </td>
                  <td className="px-4 py-2 border">{comm.doctor_name}</td>
                  <td className="px-4 py-2 border">{comm.case_id}</td>
                  <td className="px-4 py-2 border">{comm.procedure_name}</td>
                  <td className="px-4 py-2 border text-right">KES {comm.total_fee.toLocaleString()}</td>
                  <td className="px-4 py-2 border text-center">{comm.commission_percentage}%</td>
                  <td className="px-4 py-2 border text-right font-semibold">
                    KES {comm.commission_amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 border text-center">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(comm.payment_status)}`}>
                      {comm.payment_status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-2 border text-center">
                    {new Date(comm.commission_date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {commissions.length === 0 && (
          <p className="text-center text-gray-500 py-8">No commission records found for the selected period</p>
        )}
      </div>
    </div>
  )
}