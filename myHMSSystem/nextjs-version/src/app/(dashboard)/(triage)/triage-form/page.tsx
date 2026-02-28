"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

/* =========================
   CLASSIFICATION LOGIC
========================= */

const classifyTemp = (v: number) => {
  if (!v) return null
  if (v < 36) return "LOW"
  if (v > 37.5) return "HIGH"
  return "NORMAL"
}

const classifyPulse = (v: number) => {
  if (!v) return null
  if (v < 60) return "LOW"
  if (v > 100) return "HIGH"
  return "NORMAL"
}

const classifyBP = (sys: number, dia: number) => {
  if (!sys || !dia) return null
  if (sys < 90 || dia < 60) return "LOW"
  if (sys > 140 || dia > 90) return "HIGH"
  return "NORMAL"
}

const classifyBMI = (weight: number, height: number) => {
  if (!weight || !height) return null
  const bmi = weight / (height * height)
  if (bmi < 18.5) return "UNDERWEIGHT"
  if (bmi < 25) return "NORMAL"
  if (bmi < 30) return "OVERWEIGHT"
  return "OBESE"
}

const deriveOverallSeverity = (entries: (string | null)[]) =>
  entries.includes("HIGH")
    ? "HIGH"
    : entries.includes("LOW")
    ? "LOW"
    : "NORMAL"

/* =========================
   COMPONENT
========================= */

export default function TriageForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const visitId = searchParams.get("visitId")

  const [visit, setVisit] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    temperature: "",
    pulse: "",
    systolicBP: "",
    diastolicBP: "",
    weight: "",
    height: "",
    notes: ""
  })

  useEffect(() => {
    if (!visitId) return

    const loadVisit = async () => {
      const { data } = await supabase
        .from("visits")
        .select(`
          id,
          patients (
            first_name,
            last_name,
            gender
          )
        `)
        .eq("id", visitId)
        .single()

      setVisit(data)
    }

    loadVisit()
  }, [visitId])

  const onChange = (e: any) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  /* =========================
     DERIVED VALUES
  ========================== */

  const vitals = useMemo(() => {
    const temp = classifyTemp(Number(form.temperature))
    const pulse = classifyPulse(Number(form.pulse))
    const bp = classifyBP(
      Number(form.systolicBP),
      Number(form.diastolicBP)
    )

    const height = Number(form.height)
    const weight = Number(form.weight)

    const bmi =
      height && weight ? weight / (height * height) : null

    const bmiClass = classifyBMI(bmi || 0)

    const overall = deriveOverallSeverity(
      [temp, pulse, bp].filter(Boolean)
    )

    return { temp, pulse, bp, bmi, bmiClass, overall }
  }, [form])

  /* =========================
     SUBMIT
  ========================== */

  const submit = async (e: any) => {
    e.preventDefault()
    if (!visitId) return

    setLoading(true)

    const { error: triageError } = await supabase
      .from("triage")
      .insert({
        visit_id: visitId,
        temperature: Number(form.temperature) || null,
        blood_pressure:
          form.systolicBP && form.diastolicBP
            ? `${form.systolicBP}/${form.diastolicBP}`
            : null,
        pulse: Number(form.pulse) || null,
        weight: Number(form.weight) || null,
        notes: form.notes || null
      })

    if (triageError) {
      alert(triageError.message)
      setLoading(false)
      return
    }

    await supabase
      .from("visits")
      .update({
        status: "WAITING_DOCTOR",
        triage_status: "completed"
      })
      .eq("id", visitId)

    alert("Triage saved & sent to doctor")
    router.push("/opd-queue")
  }

  if (!visit) return <p className="p-6">Loading...</p>

  return (
    <div className="p-6 max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">Triage Form</h1>

      <div className="bg-white p-4 rounded shadow">
        <p className="font-semibold">
          {visit.patients.first_name} {visit.patients.last_name}
        </p>
        <p className="text-sm text-gray-500">
          {visit.patients.gender}
        </p>
      </div>

      <form onSubmit={submit} className="space-y-3">

        <input name="temperature" placeholder="Temperature (°C)" value={form.temperature} onChange={onChange} className="border p-2 w-full rounded"/>
        <small>Temp Status: <b>{vitals.temp || "—"}</b></small>

        <input name="pulse" placeholder="Pulse (bpm)" value={form.pulse} onChange={onChange} className="border p-2 w-full rounded"/>
        <small>Pulse Status: <b>{vitals.pulse || "—"}</b></small>

        <input name="systolicBP" placeholder="Systolic BP" value={form.systolicBP} onChange={onChange} className="border p-2 w-full rounded"/>
        <input name="diastolicBP" placeholder="Diastolic BP" value={form.diastolicBP} onChange={onChange} className="border p-2 w-full rounded"/>
        <small>BP Status: <b>{vitals.bp || "—"}</b></small>

        <input name="weight" placeholder="Weight (kg)" value={form.weight} onChange={onChange} className="border p-2 w-full rounded"/>
        <input name="height" placeholder="Height (meters e.g 1.7)" value={form.height} onChange={onChange} className="border p-2 w-full rounded"/>

        {vitals.bmi && (
          <div className="bg-gray-100 p-2 rounded">
            <b>BMI:</b> {vitals.bmi.toFixed(2)} — {vitals.bmiClass}
          </div>
        )}

        <div>
          <b>Overall Severity:</b>{" "}
          <span className={
            vitals.overall === "HIGH"
              ? "text-red-600"
              : vitals.overall === "LOW"
              ? "text-orange-500"
              : "text-green-600"
          }>
            {vitals.overall}
          </span>
        </div>

        <textarea name="notes" placeholder="Notes" value={form.notes} onChange={onChange} className="border p-2 w-full rounded"/>

        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded w-full"
        >
          {loading ? "Saving..." : "Save Triage"}
        </button>

      </form>
    </div>
  )
}