"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import jsPDF from "jspdf"

const supabase = createClient()

export default function BillingPage() {
  const [patients, setPatients] = useState<any[]>([])
  const [selectedMethod, setSelectedMethod] = useState<string>("")

  useEffect(() => {
    fetchUnpaidPatients()
  }, [])

  async function fetchUnpaidPatients() {
    const { data } = await supabase
      .from("patients")
      .select("*")
      .eq("payment_status", "not_paid")
      .order("created_at", { ascending: true })

    if (data) setPatients(data)
  }

async function approvePayment(invoiceId, patientId, totalAmount, paymentMethod) {

  // 1️⃣ Insert into payments table
  await supabase.from("payments").insert({
    invoice_id: invoiceId,
    payment_method: paymentMethod,
    amount_paid: totalAmount
  })

  // 2️⃣ Update invoice
  await supabase
    .from("invoices")
    .update({ status: "paid" })
    .eq("id", invoiceId)

  // 3️⃣ Update patient
  await supabase
    .from("patients")
    .update({ payment_status: "paid" })
    .eq("id", patientId)

  alert("Payment Approved")


function generateReceipt(invoice) {
  const doc = new jsPDF()

  doc.text("Lifepoint Hospital", 20, 20)
  doc.text(`Invoice: ${invoice.invoice_number}`, 20, 30)
  doc.text(`Amount Paid: KES ${invoice.total_amount}`, 20, 40)
  doc.text(`Status: Paid`, 20, 50)

  doc.save(`${invoice.invoice_number}.pdf`)
}
}
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-6">Billing Department</h1>

      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">#</th>
            <th className="border p-2">Patient</th>
            <th className="border p-2">Phone</th>
            <th className="border p-2">Payment Method</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>

        <tbody>
          {patients.map((patient, index) => (
            <tr key={patient.id}>
              <td className="border p-2 text-center">{index + 1}</td>

              <td className="border p-2">
                {patient.first_name} {patient.last_name}
              </td>

              <td className="border p-2">{patient.phone}</td>

              <td className="border p-2">
                <select
                  className="border p-1 rounded"
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="cash">Cash</option>
                  <option value="insurance">Insurance</option>
                  <option value="credit_card">Credit Card</option>
                </select>
              </td>

              <td className="border p-2 text-center">
                <button
                  onClick={() => approvePayment(patient.id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                >
                  Approve Payment
                </button>
              </td>
            </tr>
          ))}

          {patients.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center p-4">
                No unpaid patients 🎉
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}