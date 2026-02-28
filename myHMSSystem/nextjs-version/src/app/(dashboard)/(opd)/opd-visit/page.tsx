"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"


const supabase = createClient()

// Danger diagnosis keywords
const DANGER_KEYWORDS = [
  "malaria",
  "typhoid",
  "meningitis",
  "sepsis",
  "pneumonia",
  "tuberculosis",
  "cholera",
  "stroke",
  "myocardial",
  "hemorrhage",
]
const isDangerDiagnosis = (title = "") =>
  DANGER_KEYWORDS.some(k => title.toLowerCase().includes(k))

// ICD → Suggested labs mapping
const ICD_LAB_MAP: Record<string, string[]> = {
  malaria: ["Malaria smear", "RDT malaria"],
  typhoid: ["Widal test", "Blood culture"],
  pneumonia: ["Chest X-ray", "Full blood count"],
  tuberculosis: ["GeneXpert", "Sputum AFB"],
  cholera: ["Stool culture", "Electrolytes"],
}

export default function OPDVisit() {
    const searchParams = useSearchParams()
    const visitId = searchParams.get("visitId")
    const router = useRouter()

  // LOADING STATE
  const [loading, setLoading] = useState(true)
  const [closing, setClosing] = useState(false)

  // VISIT DATA
  const [visit, setVisit] = useState<any>(null)
  const [patient, setPatient] = useState<any>(null)
  const [triage, setTriage] = useState<any>(null)

  // CONSULTATION
  const [chiefComplaint, setChiefComplaint] = useState("")
  const [historyOfPresentIllness, setHPI] = useState("")
  const [examination, setExamination] = useState("")
  const [diagnosis, setDiagnosis] = useState("")
  const [notes, setNotes] = useState("")

  // ICD
  const [icdResults, setIcdResults] = useState<any[]>([])
  const [selectedICD, setSelectedICD] = useState<any>(null)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [diagnosisLocked, setDiagnosisLocked] = useState(false)
  const [suggestedLabs, setSuggestedLabs] = useState<string[]>([])

  // LABS
  const [labs, setLabs] = useState([""])
  const [labRequests, setLabRequests] = useState<any[]>([])
  const [hasPendingLabs, setHasPendingLabs] = useState(false)

  // PHARMACY
  const [drugs, setDrugs] = useState([{ name: "", dose: "", frequency: "" }])

  // THEATRE / SURGERY
  const [showBooking, setShowBooking] = useState(false)
  const [procedure, setProcedure] = useState("")
  const [urgency, setUrgency] = useState("ELECTIVE")
  const [preferredDate, setPreferredDate] = useState("")
  const [estimatedDuration, setEstimatedDuration] = useState("")



  const generateBookingId = () =>
    `LPH-OT-${Math.floor(1000 + Math.random() * 9000)}`

  // =========================
  // LOAD VISIT + TRIAGE
  // =========================
  useEffect(() => {
    const load = async () => {
      const { data: visitData, error: visitError } = await supabase
        .from("visits")
        .select(`
          id,
          visit_no,
          patient:patients (id, first_name, last_name)
        `)
        .eq("id", visitId)
        .single()

      if (visitError || !visitData) {
        alert("Visit not found")
        router.push("/opd-queue")
        return
      }

      const { data: triageData } = await supabase
        .from("triage")
        .select("*")
        .eq("visit_id", visitId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      setVisit(visitData)
      setPatient(visitData.patient)
      setTriage(triageData)
      setLoading(false)
    }
    load()
  }, [visitId, router])

  // =========================
  // LOAD LAB REQUESTS
  // =========================
useEffect(() => {

  if (!visitId) return

  const load = async () => {

    try {

      const { data: visitData, error: visitError } = await supabase
        .from("visits")
        .select(`
          id,
          visit_no,
          patient:patients (
            id,
            first_name,
            last_name
          )
        `)
        .eq("id", visitId)
        .single()

      if (visitError || !visitData) {
        alert("Visit not found")
        router.push("/opd-queue")
        return
      }

      const { data: triageData } = await supabase
        .from("triage")
        .select("*")
        .eq("visit_id", visitId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      setVisit(visitData)
      setPatient(visitData.patient)
      setTriage(triageData)

    } catch (err) {
      console.error(err)
      alert("Failed to load visit")
    }

    setLoading(false)
  }

  load()

}, [visitId])
  // =========================
  // ICD-11 SUGGESTIONS
  // =========================
useEffect(() => {
  if (diagnosisLocked || diagnosis.trim().length < 3) {
    setIcdResults([])
    return
  }

  const timer = setTimeout(async () => {
    try {
      const res = await fetch(`/api/icd11/suggest?q=${encodeURIComponent(diagnosis)}`)

      if (!res.ok) return

      const data = await res.json()
      setIcdResults(Array.isArray(data) ? data.slice(0, 8) : [])

    } catch (err) {
      console.error("ICD fetch error", err)
    }
  }, 400)

  return () => clearTimeout(timer)

}, [diagnosis, diagnosisLocked])

const handleDiagnosisKeyDown = (e: any) => {
  if (icdResults.length === 0) return
    if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveIndex(i => (i + 1) % icdResults.length)
    } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveIndex(i => (i - 1 + icdResults.length) % icdResults.length)
    } else if (e.key === "Enter") {
        e.preventDefault()
        const selected = icdResults[activeIndex]
        if (selected) selectedICD(selected)
    }  
} 

  const selectDiagnosis = async (r: any) => {
    setDiagnosis(r.title)
    setSelectedICD(r)
    setDiagnosisLocked(true)
    setIcdResults([])
    setActiveIndex(-1)

    const key = Object.keys(ICD_LAB_MAP).find(k =>
      r.title.toLowerCase().includes(k)
    )
    if (key) setSuggestedLabs(ICD_LAB_MAP[key])

    if (isDangerDiagnosis(r.title) && triage?.severity !== "HIGH") {
      await supabase
        .from("triage")
        .update({ severity: "HIGH" })
        .eq("visit_id", visitId)

      setTriage((t: any) => ({ ...t, severity: "HIGH" }))
    }
  }

  // =========================
  // ACTIONS
  // =========================
  const saveConsultation = async () => {
    if (!selectedICD) return alert("Please select a diagnosis")

    await supabase.from("consultations").insert({
      visit_id: visitId,
      patient_id: patient.id,
      chief_complaint: chiefComplaint,
      history_of_present_illness: historyOfPresentIllness,
      examination,
      diagnosis_text: diagnosis,
      icd11_code: selectedICD.code,
      icd11_title: selectedICD.title,
      notes,
    })

    alert("Consultation saved")
  }

  const sendLab = async () => {
    const clean = labs.filter(Boolean)
    if (!clean.length) return alert("Add at least one lab test")

    await supabase.from("lab_requests").insert(
      clean.map(test => ({
        visit_id: visitId,
        test_name: test,
        status: "PENDING",
      }))
    )

    alert("Sent to lab")
  }

  const sendPrescription = async () => {
    const clean = drugs.filter(d => d.name)
    if (!clean.length) return alert("Add medication")

    await supabase.from("prescriptions").insert({
      visit_id: visitId,
      medications: clean,
    })

    alert("Sent to pharmacy")
  }

  const closeConsultation = async () => {
    if (!selectedICD) return alert("Diagnosis required before closing consultation")
    setClosing(true)

    await supabase
      .from("consultations")
      .update({ status: "CLOSED", closed_at: new Date().toISOString() })
      .eq("visit_id", visitId)

    await supabase
      .from("visits")
      .update({ status: "COMPLETED" })
      .eq("id", visitId)

    alert("Consultation closed")
    router.push("/opd")
  }

  const admitToIPD = async () => {
    if (!selectedICD) return alert("Diagnosis required before admission")
    setClosing(true)

    await supabase.from("ipd_admissions").insert({
      visit_id: visitId,
      patient_id: patient.id,
      admitted_at: new Date().toISOString(),
      status: "ACTIVE",
    })

    await supabase
      .from("consultations")
      .update({ status: "CLOSED", closed_at: new Date().toISOString() })
      .eq("visit_id", visitId)

    await supabase
      .from("visits")
      .update({ status: "ADMITTED" })
      .eq("id", visitId)

    alert("Patient admitted to IPD")
    router.push("/ipd")
  }

  const bookForSurgery = async () => {
    if (!selectedICD || !procedure || !preferredDate) {
      alert("Diagnosis, procedure, and preferred date are required")
      return
    }

    const { error } = await supabase.from("theatre_bookings").insert({
      booking_id: generateBookingId(),
      patient_id: patient.id,
      visit_id: visitId,
      source: "OPD",
      procedure_name: procedure,
      urgency,
      preferred_date: preferredDate,
      estimated_duration_minutes: parseInt(estimatedDuration) || 0,
      status: "BOOKED",
    })

    if (error) return alert("Failed to book surgery")
    alert("Surgery booked successfully")
    setShowBooking(false)
  }

  if (loading) return <div>Loading…</div>

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <h2>
        {visit?.visit_no} — {patient?.first_name} {patient?.last_name}
      </h2>

      {triage && (
        <div style={{ fontSize: 13 }}>
          Temp {triage.temperature}°C • Pulse {triage.pulse} •
          BP {triage.bp_systolic}/{triage.bp_diastolic} • SpO₂ {triage.spo2}%
        </div>
      )}

      {/* CONSULTATION */}
      <h3>Consultation</h3>
      <input
        placeholder="Chief Complaint"
        value={chiefComplaint}
        onChange={e => setChiefComplaint(e.target.value)}
      />
      <textarea
        placeholder="History of Present Illness"
        value={historyOfPresentIllness}
        onChange={e => setHPI(e.target.value)}
      />
      <textarea
        placeholder="Examination Findings"
        value={examination}
        onChange={e => setExamination(e.target.value)}
      />

      <h4>Diagnosis (ICD-11)</h4>
      <input
        placeholder={hasPendingLabs ? "Diagnosis locked until labs reviewed" : "Type diagnosis (e.g. malaria)"}
        value={diagnosis}
        disabled={hasPendingLabs}
        onChange={e => {
        setDiagnosis(e.target.value)
        setSelectedICD(null)
        setDiagnosisLocked(false)
        }}
        onKeyDown={handleDiagnosisKeyDown}
      />
      {icdResults.map((item) => (
        <div
            key={item.code}
            className="p-3 border rounded-lg mb-2 hover:bg-blue-50 cursor-pointer"
            onClick={() => selectDiagnosis(item)}
        >
            <div>
                {item.title} <span className="text-gray-500">({item.code})</span>
            </div>
        </div>
        ))}

      {suggestedLabs.length > 0 && <div>Suggested Labs: {suggestedLabs.join(", ")}</div>}
      <textarea
        placeholder="Doctor Notes"
        value={notes}
        onChange={e => setNotes(e.target.value)}
      />

      <button onClick={saveConsultation}>Save Consultation</button>

      {/* LABS */}
      <h3>Send to Lab</h3>
      {labs.map((l, i) => (
        <input key={i} value={l} onChange={e => { const c = [...labs]; c[i] = e.target.value; setLabs(c) }} />
      ))}
      <button onClick={() => setLabs([...labs, ""])}>+ Add Lab</button>
      <button onClick={sendLab}>Send to Lab</button>

      {/* PRESCRIPTION */}
      <h3>Prescription</h3>
      {drugs.map((d, i) => (
        <div key={i}>
          <input placeholder="Drug" value={d.name} onChange={e => { const c = [...drugs]; c[i].name = e.target.value; setDrugs(c) }} />
          <input placeholder="Dose" value={d.dose} onChange={e => { const c = [...drugs]; c[i].dose = e.target.value; setDrugs(c) }} />
          <input placeholder="Frequency" value={d.frequency} onChange={e => { const c = [...drugs]; c[i].frequency = e.target.value; setDrugs(c) }} />
        </div>
      ))}
      <button onClick={() => setDrugs([...drugs, { name: "", dose: "", frequency: "" }])}>+ Add Drug</button>
      <button onClick={sendPrescription}>Send to Pharmacy</button>

      {/* SURGERY */}
      {showBooking && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)" }}>
          <div style={{ background: "#fff", padding: 20 }}>
            <input placeholder="Procedure" value={procedure} onChange={e => setProcedure(e.target.value)} />
            <select value={urgency} onChange={e => setUrgency(e.target.value)}>
              <option value="ELECTIVE">Elective</option>
              <option value="EMERGENCY">Emergency</option>
            </select>
            <input type="date" value={preferredDate} onChange={e => setPreferredDate(e.target.value)} />
            <input placeholder="Estimated Duration" value={estimatedDuration} onChange={e => setEstimatedDuration(e.target.value)} />
            <button onClick={bookForSurgery}>Confirm Booking</button>
            <button onClick={() => setShowBooking(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* FINAL ACTIONS */}
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button onClick={() => setShowBooking(true)}>Book for Surgery</button>
        <button onClick={admitToIPD} disabled={closing}>Admit to IPD</button>
        <button onClick={closeConsultation} disabled={closing}>Close Consultation</button>
      </div>

      <button onClick={() => router.push("/opd-queue")}>← Back</button>
    </div>
  )

}
