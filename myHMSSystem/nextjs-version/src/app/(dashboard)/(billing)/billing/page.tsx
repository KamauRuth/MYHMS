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

    const { data } = await supabase
      .from("invoices")
      .select("*,patients(first_name,last_name)")
      .eq("status", "unpaid")

    setInvoices(data || [])

    // Dashboard summaries
    const unpaidTotal = (data || []).reduce((sum, inv) => sum + inv.balance, 0)
    setTotalUnpaid(unpaidTotal)

    const today = new Date().toISOString().split("T")[0]

    const { data: todayPayments } = await supabase
      .from("payments")
      .select("amount_paid, created_at")
    
    const todayTotal = (todayPayments || [])
      .filter(p => p.created_at.startsWith(today))
      .reduce((sum, p) => sum + p.amount_paid, 0)

    setTotalToday(todayTotal)
  }

 async function pay(invoice: any, amount: number) {

  if (amount <= 0) return

  await supabase.from("payments").insert({
    invoice_id: invoice.id,
    amount_paid: amount,
    payment_method: "Cash"
  })

  // Update invoice
  await supabase.from("invoices")
    .update({
      paid_amount: invoice.total_amount,
      balance: 0,
      status: "paid"
    })
    .eq("id", invoice.id)

  // 🔥 If invoice is linked to lab_order → unlock lab
  if (invoice.lab_order_id) {
    await supabase
      .from("lab_orders")
      .update({ payment_status: "PAID" })
      .eq("id", invoice.lab_order_id)
  }

  load()
}

  return (
    <div className="p-8 space-y-8">

      <h1 className="text-2xl font-bold">Payment Dashboard</h1>

      {/* SUMMARY CARDS */}
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

      {/* INVOICE LIST */}
      <div className="space-y-4">

        {invoices.map(inv => (
          <div
            key={inv.id}
            className="border rounded-xl p-4 flex justify-between items-center shadow-sm"
          >

            <div className="space-y-1">
              <div className="font-semibold">
                {inv.patients.first_name} {inv.patients.last_name}
              </div>

              <div className="text-sm text-gray-600">
                Total: KES {inv.total_amount}
              </div>

              <div className="text-sm text-red-600">
                Balance: KES {inv.balance}
              </div>
            </div>

            <button
              onClick={() => pay(inv, inv.balance)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              Approve Payment
            </button>

          </div>
        ))}

      </div>

    </div>
  )
}