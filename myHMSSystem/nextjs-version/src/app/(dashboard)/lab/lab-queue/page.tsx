"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Clock3, FlaskConical, RefreshCw, Search } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function LabQueue() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const router = useRouter()

  const load = useCallback(async () => {
    setError("")
    const { data, error: requestError } = await supabase
      .from("lab_requests")
      .select(`id,visit_id,status,lab_amount,payment_status,created_at,lab_test_master(test_name),visits(visit_no,patients(first_name,last_name))`)
      .order("created_at", { ascending: true })

    if (requestError) setError(requestError.message)
    else setRequests((data || []).filter((request: any) => {
      const paid = String(request.payment_status || "").toLowerCase() === "paid"
      const status = String(request.status || "pending").toLowerCase()
      return paid && !["awaiting_validation", "completed", "cancelled", "done", "released"].includes(status)
    }))
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const interval = window.setInterval(load, 10000)
    return () => window.clearInterval(interval)
  }, [load])

  const visibleRequests = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return requests
    return requests.filter((request) => {
      const patient = request.visits?.patients
      return `${patient?.first_name || ""} ${patient?.last_name || ""} ${request.lab_test_master?.test_name || ""} ${request.visits?.visit_no || ""}`.toLowerCase().includes(query)
    })
  }, [requests, search])

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Paid and cleared</p><h1 className="mt-1 text-3xl font-bold text-slate-950">Ready Lab Queue</h1><p className="mt-1 text-sm text-slate-600">Only fully paid tests appear here for processing.</p></div>
        <button onClick={load} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-emerald-800">Ready for testing</p><p className="mt-1 text-3xl font-bold text-emerald-950">{requests.length}</p></div><CheckCircle2 className="h-8 w-8 text-emerald-600" /></div></div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-blue-800">Queue rule</p><p className="mt-1 font-bold text-blue-950">Payment + receipt confirmed</p></div><FlaskConical className="h-8 w-8 text-blue-600" /></div></div>
      </div>

      <label className="relative block"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patient, test or visit number" className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm" /></label>
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Unable to load paid labs: {error}</div>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? <div className="p-10 text-center text-sm text-slate-500">Loading paid laboratory requests…</div> : visibleRequests.length === 0 ? <div className="p-10 text-center"><Clock3 className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 font-medium text-slate-700">No paid labs waiting</p><p className="text-sm text-slate-500">New requests appear automatically after Finance approves payment.</p></div> : <div className="divide-y divide-slate-100">{visibleRequests.map((request) => { const patient = request.visits?.patients; const status = String(request.status || "pending").toLowerCase(); const sampleReady = ["sample_collected", "received", "processing", "in_progress"].includes(status); return <div key={request.id} className="grid gap-3 p-5 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-center"><div><p className="font-semibold text-slate-950">{patient ? `${patient.first_name} ${patient.last_name}` : "Unknown patient"}</p><p className="text-xs text-slate-500">{request.visits?.visit_no || request.visit_id}</p></div><div><p className="text-xs text-slate-500">Test</p><p className="text-sm font-medium text-slate-800">{request.lab_test_master?.test_name || "Laboratory test"}</p><p className="mt-1 text-xs capitalize text-slate-500">{status.replace(/_/g, " ")}</p></div><div><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Paid</span><p className="mt-2 text-xs text-slate-500">KES {Number(request.lab_amount || 0).toLocaleString()}</p></div><button onClick={() => router.push(sampleReady ? `/lab/results?requestId=${request.id}` : `/lab/samples?requestId=${request.id}`)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">{sampleReady ? "Enter results" : "Collect sample"}</button></div> })}</div>}
      </div>
    </div>
  )
}
