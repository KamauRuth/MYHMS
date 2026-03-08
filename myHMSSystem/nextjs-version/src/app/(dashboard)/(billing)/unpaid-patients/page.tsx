"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function Billing() {

  const [invoices, setInvoices] = useState<any[]>([])
  const [totalUnpaid, setTotalUnpaid] = useState(0)
  const [totalToday, setTotalToday] = useState(0)

  useEffect(() => {
    load()
  }, [])

  async function load() {

    const { data, error } = await supabase
      .from("invoices")
      .select(`
        id,
        total_amount,
        balance,
        status,
        paid_amount,
        patients (
          first_name,
          last_name
        )
      `)
      .eq("status", "unpaid")

    if (error) {
      console.error("Invoice fetch error:", error)
      return
    }

    setInvoices(data || [])

    // Calculate unpaid total safely
    const unpaidTotal = (data || []).reduce(
      (sum, inv) => sum + (inv.balance || 0),
      0
    )

    setTotalUnpaid(unpaidTotal)

    // Today's payments
    const today = new Date().toISOString().split("T")[0]

    const { data: todayPayments, error: paymentError } = await supabase
      .from("payments")
      .select("amount_paid, created_at")

    if (paymentError) {
      console.error(paymentError)
      return
    }

    const todayTotal = (todayPayments || [])
      .filter(p => p.created_at?.startsWith(today))
      .reduce((sum, p) => sum + (p.amount_paid || 0), 0)

    setTotalToday(todayTotal)
  }

  async function pay(invoice: any, amount: number) {

    console.log("Starting payment...")
    console.log("Invoice:", invoice)

    if (!amount || amount <= 0) {
      alert("Invoice balance is zero")
      return
    }

    // Insert payment
    const { error: paymentError } = await supabase
      .from("payments")
      .insert({
        invoice_id: invoice.id,
        amount_paid: amount,
        payment_method: "Cash"
      })

    if (paymentError) {
      console.error("Payment error:", paymentError)
      alert("Payment failed")
      return
    }

    // Update invoice
    const { error: invoiceError } = await supabase
      .from("invoices")
      .update({
        status: "paid",
        balance: 0,
        paid_amount: invoice.total_amount
      })
      .eq("id", invoice.id)

    if (invoiceError) {
      console.error(invoiceError)
      alert("Invoice update failed")
      return
    }

    console.log("Payment successful")

    await load()
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

      <h1 className="text-2xl font-bold">Payment Dashboard</h1>

      {/* SUMMARY */}

      <div className="grid md:grid-cols-2 gap-6">

        <div className="bg-red-50 border border-red-200 p-6 rounded-xl">
          <div className="text-sm text-gray-600">Total Unpaid</div>
          <div className="text-2xl font-bold text-red-600">
            KES {totalUnpaid}
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 p-6 rounded-xl">
          <div className="text-sm text-gray-600">Payments Today</div>
          <div className="text-2xl font-bold text-green-600">
            KES {totalToday}
          </div>
        </div>

      </div>

      {/* INVOICES */}

      <div className="space-y-4">

        {invoices.map(inv => (

          <div
            key={inv.id}
            className="border rounded-xl p-4 flex justify-between items-center shadow-sm"
          >

            <div className="space-y-1">

              <div className="font-semibold">
                {inv.patients
                  ? `${inv.patients.first_name} ${inv.patients.last_name}`
                  : "Unknown Patient"}
              </div>

              <div className="text-sm text-gray-600">
                Total: KES {inv.total_amount || 0}
              </div>

              <div className="text-sm text-red-600">
                Balance: KES {inv.balance || 0}
              </div>

            </div>

            <div className="flex gap-3">

              <button
                onClick={() => stkPush(inv)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Pay via M-Pesa
              </button>

              <button
                disabled={inv.status === "paid"}
                onClick={() => pay(inv, inv.balance)}
                className={`px-4 py-2 rounded-lg text-white ${
                  inv.status === "paid"
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {inv.status === "paid" ? "Paid" : "Approve Payment"}
              </button>

            </div>

          </div>

        ))}

      </div>

    </div>

  )
}