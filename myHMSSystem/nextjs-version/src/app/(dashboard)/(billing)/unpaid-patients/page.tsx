"use client"

import { useEffect, useMemo, useState } from "react"
import { Banknote, ChevronDown, ChevronUp, CreditCard, ReceiptText, Search, UserRound } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

const categoryMeta: Record<string, { label: string; color: string }> = {
  registration: { label: "Registration & OPD", color: "border-blue-200 bg-blue-50 text-blue-800" },
  laboratory: { label: "Laboratory", color: "border-violet-200 bg-violet-50 text-violet-800" },
  pharmacy: { label: "Pharmacy", color: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  dental: { label: "Dental", color: "border-cyan-200 bg-cyan-50 text-cyan-800" },
  ipd: { label: "IPD accumulated account", color: "border-amber-200 bg-amber-50 text-amber-900" },
  theatre: { label: "Theatre", color: "border-rose-200 bg-rose-50 text-rose-800" },
  other: { label: "Other services", color: "border-slate-200 bg-slate-50 text-slate-800" },
}

function serviceCategory(items: any[]) {
  const types = items.map((item) => String(item.item_type || "").toLowerCase())
  if (types.some((type) => type.includes("ipd") || type.includes("bed"))) return "ipd"
  if (types.some((type) => type.includes("lab"))) return "laboratory"
  if (types.some((type) => type.includes("pharmacy") || type.includes("drug") || type.includes("prescription"))) return "pharmacy"
  if (types.some((type) => type.includes("dental"))) return "dental"
  if (types.some((type) => type.includes("theatre") || type.includes("surgery"))) return "theatre"
  if (types.some((type) => type.includes("reception") || type.includes("opd") || type.includes("consultation"))) return "registration"
  return "other"
}

export default function ServicePaymentsPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [openPatient, setOpenPatient] = useState<string | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [methods, setMethods] = useState<Record<string, string>>({})

  const load = async () => {
    setLoading(true)
    const { data, error: invoiceError } = await supabase.from("invoices").select(`*,patients(id,first_name,last_name),invoice_items(id,item_id,item_type,description,quantity,unit_price,total_price)`).gt("balance", 0).order("created_at", { ascending: true })
    if (invoiceError) setError(invoiceError.message)
    else { setInvoices(data || []); setError("") }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const patients = useMemo(() => {
    const grouped = new Map<string, any>()
    invoices.forEach((invoice) => {
      const key = invoice.patient_id || `unknown-${invoice.id}`
      if (!grouped.has(key)) grouped.set(key, { id: key, patient: invoice.patients, invoices: [], total: 0 })
      const group = grouped.get(key)
      group.invoices.push({ ...invoice, category: serviceCategory(invoice.invoice_items || []) })
      group.total += Number(invoice.balance || 0)
    })
    const query = search.trim().toLowerCase()
    return [...grouped.values()].filter((group) => !query || `${group.patient?.first_name || ""} ${group.patient?.last_name || ""} ${group.id}`.toLowerCase().includes(query))
  }, [invoices, search])

  const totalOutstanding = invoices.reduce((sum, invoice) => sum + Number(invoice.balance || 0), 0)

  async function approvePayment(invoice: any) {
    const amount = Number(invoice.balance || 0)
    if (amount <= 0) return
    const method = methods[invoice.id] || "Cash"
    const reference = method === "Cash" ? null : prompt(`Enter ${method} reference number`)
    if (method !== "Cash" && !reference) return

    setProcessing(invoice.id)
    try {
      const { data: payment, error: paymentError } = await supabase.from("payments").insert({ invoice_id: invoice.id, amount_paid: amount, payment_method: method, reference_number: reference, created_at: new Date().toISOString() }).select().single()
      if (paymentError) throw paymentError

      const paidAmount = Number(invoice.paid_amount || 0) + amount
      const { error: invoiceError } = await supabase.from("invoices").update({ status: "paid", balance: 0, paid_amount: paidAmount }).eq("id", invoice.id)
      if (invoiceError) throw invoiceError

      const category = invoice.category || serviceCategory(invoice.invoice_items || [])
      if (category === "laboratory") {
        const itemIds = (invoice.invoice_items || []).map((item: any) => item.item_id).filter(Boolean)
        if (itemIds.length) {
          await supabase.from("lab_requests").update({ payment_status: "PAID" }).in("id", itemIds)
          if (invoice.visit_id) await supabase.from("lab_requests").update({ payment_status: "PAID" }).eq("visit_id", invoice.visit_id).in("test_id", itemIds)
        }
      }
      if (category === "registration" && invoice.visit_id) await supabase.from("visits").update({ payment_status: "paid" }).eq("id", invoice.visit_id)

      printReceipt(invoice, payment, category)
      await load()
    } catch (paymentError: any) {
      alert(`Payment failed: ${paymentError.message || "Unknown error"}`)
    } finally {
      setProcessing(null)
    }
  }

  function printReceipt(invoice: any, payment: any, category: string) {
    const receiptNumber = `LPH-RCP-${String(payment.id).slice(0, 8).toUpperCase()}`
    const meta = categoryMeta[category] || categoryMeta.other
    const patientName = invoice.patients ? `${invoice.patients.first_name} ${invoice.patients.last_name}` : "Patient"
    const popup = window.open("", "_blank", "width=760,height=820")
    if (!popup) return alert(`Receipt ${receiptNumber} was generated, but the print window was blocked.`)
    const rows = (invoice.invoice_items || []).map((item: any) => `<tr><td>${item.description || item.item_type}</td><td>${Number(item.quantity || 1)}</td><td style="text-align:right">KES ${Number(item.total_price || 0).toLocaleString()}</td></tr>`).join("")
    popup.document.write(`<!doctype html><html><head><title>${receiptNumber}</title><style>body{font-family:Arial;color:#172033;padding:40px}.head{text-align:center;border-bottom:2px solid #2563eb;padding-bottom:16px}.head h1{color:#2563eb;margin:0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:22px 0}.box{background:#f8fafc;border-radius:8px;padding:11px}table{width:100%;border-collapse:collapse}th,td{padding:10px;border-bottom:1px solid #e2e8f0;text-align:left}.total{text-align:right;font-size:22px;font-weight:bold;margin-top:22px}.foot{text-align:center;color:#64748b;font-size:12px;margin-top:40px}</style></head><body><div class="head"><h1>LifePoint Hospital</h1><p>Official ${meta.label} Receipt</p></div><div class="grid"><div class="box"><b>Receipt</b><br>${receiptNumber}</div><div class="box"><b>Date</b><br>${new Date(payment.created_at).toLocaleString()}</div><div class="box"><b>Patient</b><br>${patientName}</div><div class="box"><b>Invoice</b><br>${invoice.invoice_number || invoice.id}</div><div class="box"><b>Payment method</b><br>${payment.payment_method}</div><div class="box"><b>Service stage</b><br>${meta.label}</div></div><table><thead><tr><th>Service</th><th>Qty</th><th style="text-align:right">Amount</th></tr></thead><tbody>${rows}</tbody></table><div class="total">Paid: KES ${Number(payment.amount_paid).toLocaleString()}</div><div class="foot">Payment received. Keep this receipt for your records.</div><script>window.onload=()=>window.print()</script></body></html>`)
    popup.document.close()
  }

  return <div className="mx-auto max-w-7xl space-y-6 p-6">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Stage-by-stage collection</p><h1 className="mt-1 text-3xl font-bold text-slate-950">Patient Service Bills</h1><p className="mt-1 text-sm text-slate-600">Open a patient, then approve each service category as it is paid. IPD remains cumulative.</p></div><button onClick={load} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">Refresh bills</button></div>
    <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-rose-200 bg-rose-50 p-5"><p className="text-sm text-rose-700">Total outstanding</p><p className="mt-1 text-3xl font-bold text-rose-950">KES {totalOutstanding.toLocaleString()}</p></div><div className="rounded-2xl border border-blue-200 bg-blue-50 p-5"><p className="text-sm text-blue-700">Patients awaiting payment</p><p className="mt-1 text-3xl font-bold text-blue-950">{patients.length}</p></div><div className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><p className="text-sm text-amber-700">Payment policy</p><p className="mt-1 font-bold text-amber-950">One receipt per service stage</p></div></div>
    <label className="relative block"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patient name or number" className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm"/></label>
    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
    {loading ? <div className="p-10 text-center text-sm text-slate-500">Loading patient bills…</div> : patients.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center"><ReceiptText className="mx-auto h-10 w-10 text-slate-300"/><p className="mt-3 font-medium">No pending service bills</p></div> : <div className="space-y-4">{patients.map((group) => { const expanded = openPatient === group.id; return <section key={group.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><button onClick={() => setOpenPatient(expanded ? null : group.id)} className="flex w-full items-center justify-between gap-4 p-5 text-left hover:bg-slate-50"><div className="flex items-center gap-3"><span className="rounded-xl bg-blue-50 p-3 text-blue-700"><UserRound className="h-5 w-5"/></span><div><p className="font-bold text-slate-950">{group.patient ? `${group.patient.first_name} ${group.patient.last_name}` : "Unknown patient"}</p><p className="text-xs text-slate-500">{group.invoices.length} pending service stage(s)</p></div></div><div className="flex items-center gap-4"><div className="text-right"><p className="text-xs text-slate-500">Outstanding</p><p className="font-bold text-rose-700">KES {group.total.toLocaleString()}</p></div>{expanded ? <ChevronUp className="h-5 w-5"/> : <ChevronDown className="h-5 w-5"/>}</div></button>{expanded && <div className="grid gap-4 border-t border-slate-200 bg-slate-50 p-5 lg:grid-cols-2">{group.invoices.map((invoice: any) => { const meta = categoryMeta[invoice.category] || categoryMeta.other; return <article key={invoice.id} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.color}`}>{meta.label}</span><p className="mt-2 text-xs text-slate-500">{invoice.invoice_number || invoice.id}</p></div><p className="text-xl font-bold text-slate-950">KES {Number(invoice.balance || 0).toLocaleString()}</p></div><div className="my-4 space-y-2 border-y border-slate-100 py-3">{(invoice.invoice_items || []).map((item: any) => <div key={item.id} className="flex justify-between gap-3 text-sm"><span className="text-slate-700">{item.description || item.item_type}</span><span className="font-medium">KES {Number(item.total_price || 0).toLocaleString()}</span></div>)}</div><div className="flex flex-col gap-2 sm:flex-row"><select value={methods[invoice.id] || "Cash"} onChange={(event) => setMethods((current) => ({...current,[invoice.id]:event.target.value}))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option>Cash</option><option>M-Pesa</option><option>Card</option><option>Insurance</option></select><button disabled={processing === invoice.id} onClick={() => approvePayment(invoice)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{processing === invoice.id ? "Processing…" : <><Banknote className="h-4 w-4"/> Approve & issue receipt</>}</button></div></article>})}</div>}</section>})}</div>}
  </div>
}
