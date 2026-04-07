"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

interface Invoice {
  id: string
  total_amount: number
  balance: number
  status: string
  paid_amount: number
  created_at: string
  patients: {
    first_name: string
    last_name: string
  }
}

interface Payment {
  id: string
  amount_paid: number
  payment_method: string
  created_at: string
}

export default function PaidPatients() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [totalPaid, setTotalPaid] = useState(0)
  const [totalCollectedToday, setTotalCollectedToday] = useState(0)
  const [totalInvoicesPaid, setTotalInvoicesPaid] = useState(0)
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<Payment[]>([])

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)

    // Fetch paid invoices
    const { data: invoiceData, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("status", "paid")
      .order("created_at", { ascending: false })

    if (invoiceError) {
      console.error("Invoice fetch error:", invoiceError)
      setLoading(false)
      return
    }

    // Fetch patient data for each invoice
    const invoicesWithPatients = await Promise.all(
      (invoiceData || []).map(async (invoice: any) => {
        if (!invoice.patient_id) {
          return { ...invoice, patients: null }
        }

        const { data: patientData } = await supabase
          .from("patients")
          .select("id, first_name, last_name")
          .eq("id", invoice.patient_id)
          .single()

        return {
          ...invoice,
          patients: patientData || null
        }
      })
    )

    setInvoices(invoicesWithPatients || [])
    setTotalInvoicesPaid(invoicesWithPatients?.length || 0)

    // Calculate total paid
    const paidTotal = (invoicesWithPatients || []).reduce(
      (sum, inv) => sum + (inv.paid_amount || inv.total_amount || 0),
      0
    )
    setTotalPaid(paidTotal)

    // Fetch all payments to show payment history
    const { data: paymentData, error: paymentError } = await supabase
      .from("payments")
      .select("id, amount_paid, payment_method, created_at")
      .order("created_at", { ascending: false })

    if (paymentError) {
      console.error(paymentError)
      setLoading(false)
      return
    }

    setPayments(paymentData || [])

    // Calculate payments today
    const today = new Date().toISOString().split("T")[0]

    const todayTotal = (paymentData || [])
      .filter(p => p.created_at?.startsWith(today))
      .reduce((sum, p) => sum + (p.amount_paid || 0), 0)

    setTotalCollectedToday(todayTotal)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading paid patients data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Paid Patients</h1>
        <button
          onClick={load}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          Refresh
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-green-50 border border-green-200 p-6 rounded-xl">
          <div className="text-sm text-gray-600 mb-1">Total Collected</div>
          <div className="text-3xl font-bold text-green-600">
            KES {totalPaid.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            From {totalInvoicesPaid} paid invoices
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
          <div className="text-sm text-gray-600 mb-1">Collected Today</div>
          <div className="text-3xl font-bold text-blue-600">
            KES {totalCollectedToday.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {payments.filter(p => p.created_at?.startsWith(new Date().toISOString().split("T")[0])).length} payments
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 p-6 rounded-xl">
          <div className="text-sm text-gray-600 mb-1">Paid Patients</div>
          <div className="text-3xl font-bold text-purple-600">
            {totalInvoicesPaid}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Successfully processed
          </div>
        </div>
      </div>

      {/* PAID INVOICES LIST */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Paid Invoices</h2>

        {invoices.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-600">No paid invoices yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map(inv => (
              <div
                key={inv.id}
                className="border border-green-200 rounded-xl p-5 bg-green-50 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-1 flex-1">
                    <div className="font-semibold text-lg">
                      {inv.patients
                        ? `${inv.patients.first_name} ${inv.patients.last_name}`
                        : "Unknown Patient"}
                    </div>

                    <div className="text-sm text-gray-600">
                      Invoice ID: <span className="font-mono text-xs">{inv.id.substring(0, 8)}</span>
                    </div>

                    <div className="text-sm text-gray-600">
                      Date: {new Date(inv.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Paid
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 bg-white rounded-lg p-4">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Invoice Amount</div>
                    <div className="text-xl font-bold text-gray-800">
                      KES {(inv.total_amount || 0).toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-600 mb-1">Paid Amount</div>
                    <div className="text-xl font-bold text-green-600">
                      KES {(inv.paid_amount || inv.total_amount || 0).toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-600 mb-1">Balance</div>
                    <div className="text-xl font-bold text-gray-400">
                      KES {(inv.balance || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RECENT PAYMENTS */}
      {payments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Payments</h2>

          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Method</th>
                </tr>
              </thead>
              <tbody>
                {payments.slice(0, 10).map(payment => (
                  <tr key={payment.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm">
                      {new Date(payment.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-sm font-semibold text-green-600">
                      KES {(payment.amount_paid || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                        {payment.payment_method || "Cash"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
