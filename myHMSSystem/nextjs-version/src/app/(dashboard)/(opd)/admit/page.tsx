"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, BedDouble, Building2, ClipboardList, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

type AvailableBed = {
  id: string
  bed_number: string
  ward_id: string | null
  wards: { name: string } | null
}

export default function AdmitPatient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const visitId = searchParams.get("visit_id")
  const patientId = searchParams.get("patient_id")
  const [ward, setWard] = useState("")
  const [bedId, setBedId] = useState("")
  const [reason, setReason] = useState("")
  const [beds, setBeds] = useState<AvailableBed[]>([])
  const [loadingBeds, setLoadingBeds] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBeds() {
      setLoadingBeds(true)
      const { data, error: bedsError } = await supabase
        .from("beds")
        .select("id, bed_number, ward_id, wards(name)")
        .eq("status", "AVAILABLE")
        .order("bed_number")

      if (bedsError) setError(`Unable to load available beds: ${bedsError.message}`)
      else setBeds((data as unknown as AvailableBed[]) || [])
      setLoadingBeds(false)
    }
    fetchBeds()
  }, [])

  const wardNames = useMemo(
    () => Array.from(new Set(beds.map((item) => item.wards?.name).filter(Boolean))) as string[],
    [beds]
  )
  const filteredBeds = useMemo(
    () => beds.filter((item) => item.wards?.name === ward),
    [beds, ward]
  )
  const selectedBed = beds.find((item) => item.id === bedId)

  async function admit() {
    if (!patientId || !visitId) return setError("Missing patient or visit ID. Return to the consultation and try again.")
    if (!ward || !selectedBed) return setError("Select a ward and an available bed.")
    if (!reason.trim()) return setError("Enter the clinical reason for admission.")
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/inpatient/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visit_id: visitId, patient_id: patientId, bed_id: selectedBed.id, bed_no: selectedBed.bed_number, ward, reason: reason.trim() }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to admit patient")

      const { error: consultationError } = await supabase.from("consultations").update({ status: "CLOSED", closed_at: new Date().toISOString() }).eq("visit_id", visitId)
      if (consultationError) throw consultationError
      const { error: visitError } = await supabase.from("visits").update({ status: "ADMITTED" }).eq("id", visitId)
      if (visitError) throw visitError

      router.push("/ipd")
      router.refresh()
    } catch (admissionError) {
      setError(admissionError instanceof Error ? admissionError.message : "Failed to admit patient")
      setLoading(false)
    }
  }

  if (!visitId || !patientId) {
    return <div className="mx-auto max-w-2xl px-4 py-10"><div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800"><h1 className="font-bold">Admission details are missing</h1><p className="mt-1 text-sm">Open the patient consultation and choose “Admit to IPD” again.</p><button onClick={() => router.back()} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold"><ArrowLeft className="h-4 w-4" /> Go back</button></div></div>
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex items-start gap-4">
        <button onClick={() => router.back()} className="mt-1 rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="Back to consultation"><ArrowLeft className="h-5 w-5" /></button>
        <div><h1 className="text-2xl font-bold text-slate-950">Admit Patient to IPD</h1><p className="mt-1 text-sm text-slate-600">Assign a ward and bed, then document the reason for inpatient care.</p></div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4"><h2 className="flex items-center gap-2 font-semibold text-slate-900"><Building2 className="h-5 w-5 text-blue-600" /> Bed assignment</h2><p className="mt-1 text-sm text-slate-500">Only wards with currently available beds are shown.</p></div>
          <div className="space-y-6 p-6">
            {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">Ward <span className="text-rose-600">*</span><select value={ward} onChange={(event) => { setWard(event.target.value); setBedId("") }} disabled={loadingBeds} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"><option value="">{loadingBeds ? "Loading wards…" : "Select ward"}</option>{wardNames.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
              <label className="space-y-2 text-sm font-medium text-slate-700">Bed <span className="text-rose-600">*</span><select value={bedId} onChange={(event) => setBedId(event.target.value)} disabled={!ward || loadingBeds} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none disabled:bg-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"><option value="">{ward ? "Select available bed" : "Select a ward first"}</option>{filteredBeds.map((item) => <option key={item.id} value={item.id}>Bed {item.bed_number}</option>)}</select></label>
            </div>
            <label className="block space-y-2 text-sm font-medium text-slate-700">Reason for admission <span className="text-rose-600">*</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={5} placeholder="Document the diagnosis, symptoms, or clinical indication for admission…" className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /><span className="block text-xs font-normal text-slate-500">This will appear in the patient&apos;s inpatient record.</span></label>
          </div>
          <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end"><button onClick={() => router.back()} disabled={loading} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button><button onClick={admit} disabled={loading || loadingBeds || !ward || !bedId || !reason.trim()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BedDouble className="h-4 w-4" />}{loading ? "Admitting patient…" : "Confirm admission"}</button></footer>
        </section>

        <aside className="h-fit rounded-2xl border border-blue-100 bg-blue-50 p-5"><h2 className="flex items-center gap-2 font-semibold text-blue-950"><ClipboardList className="h-5 w-5" /> Admission checklist</h2><ol className="mt-4 space-y-4 text-sm text-blue-900"><li><span className="font-semibold">1. Confirm location</span><p className="mt-0.5 text-blue-800/80">Choose the appropriate ward and an available bed.</p></li><li><span className="font-semibold">2. Record indication</span><p className="mt-0.5 text-blue-800/80">Add enough clinical detail for the receiving IPD team.</p></li><li><span className="font-semibold">3. Confirm admission</span><p className="mt-0.5 text-blue-800/80">The bed becomes occupied and the OPD visit leaves the doctor queue.</p></li></ol></aside>
      </div>
    </div>
  )
}
