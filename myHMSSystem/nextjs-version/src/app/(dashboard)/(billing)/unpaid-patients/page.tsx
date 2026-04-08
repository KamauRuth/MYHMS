"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function Billing() {

  const [invoices, setInvoices] = useState<any[]>([])
  const [totalUnpaid, setTotalUnpaid] = useState(0)
  const [totalToday, setTotalToday] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    setError(null)

    try {
      // First, get all unpaid invoices with patient information
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select(`
          *,
          patients (id, first_name, last_name)
        `)
        .eq("status", "unpaid")

      if (invoiceError) {
        console.error("Invoice fetch error:", invoiceError)
        setError(`Failed to fetch invoices: ${invoiceError.message}`)
        setLoading(false)
        return
      }

      console.log("Raw invoices:", invoiceData)

      // Patient data should already be included, but use as fallback if null
      const invoicesWithPatients = await Promise.all(
        (invoiceData || []).map(async (invoice: any) => {
          // If patients relationship is already loaded, use it
          if (invoice.patients) {
            return invoice
          }

          // Fallback: fetch patient if not included
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

      console.log("Invoices with patients:", invoicesWithPatients)
      setInvoices(invoicesWithPatients || [])

      // Calculate unpaid total safely
      const unpaidTotal = (invoicesWithPatients || []).reduce(
        (sum: number, inv) => sum + (inv.balance || 0),
        0
      )

      setTotalUnpaid(unpaidTotal)

      // Today's payments
      const today = new Date().toISOString().split("T")[0]

      const { data: todayPayments, error: paymentError } = await supabase
        .from("payments")
        .select("amount_paid, created_at")

      if (paymentError) {
        console.error("Payment fetch error:", paymentError)
      } else {
        const todayTotal = (todayPayments || [])
          .filter((p: any) => p.created_at?.startsWith(today))
          .reduce((sum: number, p: any) => sum + (p.amount_paid || 0), 0)

        setTotalToday(todayTotal)
      }
    } catch (err: any) {
      console.error("Unexpected error:", err)
      setError(err.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  console.log("Invoices:", invoices)

  async function pay(invoice: any, amount: number) {

    console.log("Starting payment...")
    console.log("Invoice:", invoice)

    if (!amount || amount <= 0) {
      alert("Invoice balance is zero")
      return
    }

    try {
      // 1️⃣ Insert payment record
      const { data: paymentData, error: paymentError } = await supabase
        .from("payments")
        .insert({
          invoice_id: invoice.id,
          amount_paid: amount,
          payment_method: "Cash",
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (paymentError) {
        console.error("Payment error:", paymentError)
        alert("Payment failed: " + paymentError.message)
        return
      }

      console.log("Payment recorded:", paymentData)

      // 2️⃣ Update invoice status and amount
      const { data: updatedInvoice, error: invoiceError } = await supabase
        .from("invoices")
        .update({
          status: "paid",
          balance: 0,
          paid_amount: invoice.total_amount
        })
        .eq("id", invoice.id)
        .select()
        .single()

      if (invoiceError) {
        console.error("Invoice update error:", invoiceError)
        alert("Invoice update failed: " + invoiceError.message)
        return
      }

      console.log("Invoice updated:", updatedInvoice)

      // 3️⃣ Reload the data
      alert("✅ Payment recorded successfully!")
      await load()
    } catch (err: any) {
      console.error("Unexpected error during payment:", err)
      alert("Error: " + err.message)
    }
  }

  async function stkPush(invoice: any) {

    const phone = prompt("Enter patient phone number")

    if (!phone) return

    try {

      const res = await fetch("/api/mpesa/stkpush", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phone,
          amount: invoice.balance
        })
      })

      const data = await res.json()

      console.log("STK Response:", data)

      alert("STK Push sent to patient phone")

    } catch (err) {

      console.error("STK Error:", err)
      alert("Failed to send STK Push")

    }
  }

  return (

    <div className="p-8 space-y-8">

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Payment Dashboard</h1>
        <button
          onClick={load}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Loading..." : "🔄 Refresh"}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading invoices...</p>
        </div>
      ) : (
        <>
          {/* SUMMARY */}

          <div className="grid md:grid-cols-2 gap-6">

            <div className="bg-red-50 border border-red-200 p-6 rounded-xl">
              <div className="text-sm text-gray-600">Total Unpaid</div>
              <div className="text-2xl font-bold text-red-600">
                KES {totalUnpaid.toLocaleString()}
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 p-6 rounded-xl">
              <div className="text-sm text-gray-600">Payments Today</div>
              <div className="text-2xl font-bold text-green-600">
                KES {totalToday.toLocaleString()}
              </div>
            </div>

          </div>

          {/* INVOICES */}

          {invoices.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-600 text-lg">✅ No unpaid invoices</p>
            </div>
          ) : (
            <div className="space-y-4">

              {invoices.map(inv => (

                <div
                  key={inv.id}
                  className="border rounded-xl p-4 flex justify-between items-center shadow-sm hover:shadow-md transition"
                >

                  <div className="space-y-1">

                    <div className="font-semibold">
                      {inv.patients
                        ? `${inv.patients.first_name} ${inv.patients.last_name}`
                        : "Unknown Patient"}
                    </div>

                    <div className="text-sm text-gray-600">
                      Total: KES {(inv.total_amount || 0).toLocaleString()}
                    </div>

                    <div className="text-sm text-red-600 font-medium">
                      Balance: KES {(inv.balance || 0).toLocaleString()}
                    </div>

                  </div>

                  <div className="flex gap-3">

                    <button
                      onClick={() => stkPush(inv)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Pay via M-Pesa
                    </button>

                    <button
                      disabled={inv.status === "paid"}
                      onClick={() => pay(inv, inv.balance)}
                      className={`px-4 py-2 rounded-lg text-white text-sm ${
                        inv.status === "paid"
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {inv.status === "paid" ? "✅ Paid" : "Approve Payment"}
                    </button>

                  </div>

                </div>

              ))}

            </div>
          )}
        </>
      )}

    </div>

  )
}