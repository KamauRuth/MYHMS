import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../services/supabase"

/* =========================
   WHO CLASSIFICATION HELPERS
========================= */
const classifyTemp = (v) => {
  if (!v) return null
  if (v < 36) return "LOW"
  if (v > 37.5) return "HIGH"
  return "NORMAL"
}

const classifyPulse = (v) => {
  if (!v) return null
  if (v < 60) return "LOW"
  if (v > 100) return "HIGH"
  return "NORMAL"
}

const classifyBP = (sys, dia) => {
  if (!sys || !dia) return null
  if (sys < 90 || dia < 60) return "LOW"
  if (sys > 140 || dia > 90) return "HIGH"
  return "NORMAL"
}

const classifySpO2 = (v) => {
  if (!v) return null
  if (v < 90) return "LOW"
  if (v < 95) return "HIGH"
  return "NORMAL"
}

const deriveOverallSeverity = (entries) =>
  entries.includes("HIGH")
    ? "HIGH"
    : entries.includes("LOW")
    ? "LOW"
    : "NORMAL"

/* =========================
   COMPONENT
========================= */
export default function TriageHome() {
  const [queue, setQueue] = useState([])
  const [selectedVisit, setSelectedVisit] = useState(null)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    temperature: "",
    pulse: "",
    systolicBP: "",
    diastolicBP: "",
    oxygenSaturation: "",
    chiefComplaint: "",
    allergies: "",
    notes: "",
  })

  /* =========================
     LOAD QUEUE
  ========================== */
  const loadQueue = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from("visits")
      .select(`
        id,
        created_at,
        patient:patients (
          id,
          patient_no,
          first_name,
          last_name
        )
      `)
      .eq("status", "TRIAGE")
      .order("created_at", { ascending: true })

    if (!error) setQueue(data || [])
    else alert("Failed to load triage queue")

    setLoading(false)
  }

  useEffect(() => {
    loadQueue()
  }, [])

  const onChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const selectVisit = (visit) => {
    setSelectedVisit(visit)
    setForm({
      temperature: "",
      pulse: "",
      systolicBP: "",
      diastolicBP: "",
      oxygenSaturation: "",
      chiefComplaint: "",
      allergies: "",
      notes: "",
    })
  }

  /* =========================
     PER-ENTRY SEVERITY
  ========================== */
  const vitals = useMemo(() => {
    const temp = classifyTemp(Number(form.temperature))
    const pulse = classifyPulse(Number(form.pulse))
    const bp = classifyBP(
      Number(form.systolicBP),
      Number(form.diastolicBP)
    )
    const spo2 = classifySpO2(Number(form.oxygenSaturation))

    const overall = deriveOverallSeverity(
      [temp, pulse, bp, spo2].filter(Boolean)
    )

    return { temp, pulse, bp, spo2, overall }
  }, [form])

  /* =========================
     SUBMIT
  ========================== */
  const submit = async (e) => {
    e.preventDefault()
    if (!selectedVisit?.patient?.id) return alert("Select patient")

    setLoading(true)

    const payload = {
      patient_id: selectedVisit.patient.id,
      visit_id: selectedVisit.id,

      temperature: Number(form.temperature) || null,
      pulse: Number(form.pulse) || null,
      bp_systolic: Number(form.systolicBP) || null,
      bp_diastolic: Number(form.diastolicBP) || null,
      spo2: Number(form.oxygenSaturation) || null,

      severity: vitals.overall, // ✅ GUARANTEED VALID
      chief_complaint: form.chiefComplaint || null,
      allergies: form.allergies || null,
      notes: form.notes || null,

      status: "PENDING",
    }

    const { error } = await supabase.from("triage").insert(payload)
    if (error) {
      console.error(error)
      alert(error.message)
      setLoading(false)
      return
    }

    await supabase
      .from("visits")
      .update({ status: "WAITING_DOCTOR" })
      .eq("id", selectedVisit.id)

    alert("Triage saved & sent to doctor")
    setSelectedVisit(null)
    await loadQueue()
    setLoading(false)
  }

  /* =========================
     UI
  ========================== */
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      {/* QUEUE */}
      <div>
        <h2>Triage Queue</h2>

        {queue.map((v) => (
          <div
            key={v.id}
            onClick={() => selectVisit(v)}
            style={{ padding: 12, borderBottom: "1px solid #eee", cursor: "pointer" }}
          >
            <b>{v.patient.patient_no}</b> — {v.patient.first_name} {v.patient.last_name}
          </div>
        ))}
      </div>

      {/* FORM */}
      <div>
        <h2>Triage Form</h2>

        {!selectedVisit ? (
          <p>Select a patient</p>
        ) : (
          <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
            <input name="temperature" placeholder="Temperature (°C)" value={form.temperature} onChange={onChange} />
            <small>Temp Status: <b>{vitals.temp || "—"}</b></small>

            <input name="pulse" placeholder="Pulse (bpm)" value={form.pulse} onChange={onChange} />
            <small>Pulse Status: <b>{vitals.pulse || "—"}</b></small>

            <input name="systolicBP" placeholder="Systolic BP" value={form.systolicBP} onChange={onChange} />
            <input name="diastolicBP" placeholder="Diastolic BP" value={form.diastolicBP} onChange={onChange} />
            <small>BP Status: <b>{vitals.bp || "—"}</b></small>

            <input name="oxygenSaturation" placeholder="SpO₂ (%)" value={form.oxygenSaturation} onChange={onChange} />
            <small>SpO₂ Status: <b>{vitals.spo2 || "—"}</b></small>

            <textarea name="chiefComplaint" placeholder="Chief Complaint" value={form.chiefComplaint} onChange={onChange} />
            <textarea name="allergies" placeholder="Allergies" value={form.allergies} onChange={onChange} />
            <textarea name="notes" placeholder="Notes" value={form.notes} onChange={onChange} />

            <div>
              <b>Overall Severity:</b>{" "}
              <span style={{ color: vitals.overall === "HIGH" ? "red" : vitals.overall === "LOW" ? "orange" : "green" }}>
                {vitals.overall}
              </span>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Triage"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
