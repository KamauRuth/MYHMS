import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { supabase } from "../../services/supabase"

/* =========================
   STYLES
========================= */
const input = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ddd",
  width: "100%",
}
const btn = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #ddd",
  cursor: "pointer",
}
const btnPrimary = { ...btn, background: "#111", color: "#fff" }

/* =========================
   DANGER ICD RULES
========================= */
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

/* =========================
   ICD → LAB MAP
========================= */
const ICD_LAB_MAP = {
  malaria: ["Malaria smear", "RDT malaria"],
  typhoid: ["Widal test", "Blood culture"],
  pneumonia: ["Chest X-ray", "Full blood count"],
  tuberculosis: ["GeneXpert", "Sputum AFB"],
  cholera: ["Stool culture", "Electrolytes"],
}

/* =========================
   COMPONENT
========================= */
export default function OPDVisit() {
  const { visitId } = useParams()
  const navigate = useNavigate()
  const API = import.meta.env.VITE_API_BASE_URL

  const [loading, setLoading] = useState(true)
  const [visit, setVisit] = useState(null)
  const [patient, setPatient] = useState(null)
  const [triage, setTriage] = useState(null)

  /* CONSULTATION */
  const [chiefComplaint, setChiefComplaint] = useState("")
  const [historyOfPresentIllness, setHPI] = useState("")
  const [examination, setExamination] = useState("")
  const [diagnosis, setDiagnosis] = useState("")
  const [notes, setNotes] = useState("")

  /* ICD */
  const [icdResults, setIcdResults] = useState([])
  const [selectedICD, setSelectedICD] = useState(null)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [diagnosisLocked, setDiagnosisLocked] = useState(false)

  /* LAB */
  const [labs, setLabs] = useState([""])
  const [labRequests, setLabRequests] = useState([])
  const [suggestedLabs, setSuggestedLabs] = useState([])
  const [hasPendingLabs, setHasPendingLabs] = useState(false)

  /* PHARMACY */
  const [drugs, setDrugs] = useState([{ name: "", dose: "", frequency: "" }])

  /* =========================
   THEATRE ADDITION
========================= */
const [showBooking, setShowBooking] = useState(false)
const [procedure, setProcedure] = useState("")
const [urgency, setUrgency] = useState("ELECTIVE")
const [preferredDate, setPreferredDate] = useState("")
const [estimatedDuration, setEstimatedDuration] = useState("")

const generateBookingId = () =>
  `LPH-OT-${Math.floor(1000 + Math.random() * 9000)}`

const bookForSurgery = async () => {
  if (!selectedICD) {
    alert("Diagnosis required before booking surgery")
    return
  }

  if (!procedure || !preferredDate) {
    alert("Procedure and preferred date required")
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

  if (error) {
    alert("Failed to book surgery")
    return
  }

  alert("Surgery booked successfully")
  setShowBooking(false)
}

  /* FINAL ACTIONS */
  const [closing, setClosing] = useState(false)

  /* =========================
     LOAD VISIT + TRIAGE
  ========================== */
  useEffect(() => {
    const load = async () => {
      const { data: visitData, error } = await supabase
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

      if (error || !visitData) {
        alert("Visit not found")
        navigate("/opd")
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
  }, [visitId, navigate])

  /* =========================
     LOAD LAB REQUESTS
  ========================== */
  useEffect(() => {
    const loadLabs = async () => {
      const { data } = await supabase
        .from("lab_requests")
        .select("*")
        .eq("visit_id", visitId)
        .order("created_at", { ascending: true })

      setLabRequests(data || [])
      setHasPendingLabs((data || []).some(l => l.status !== "DONE"))
    }

    loadLabs()
  }, [visitId])

  /* =========================
     ICD SEARCH
  ========================== */
  useEffect(() => {
    if (diagnosisLocked || diagnosis.trim().length < 3) {
      setIcdResults([])
      setActiveIndex(-1)
      return
    }

    const timer = setTimeout(async () => {
      const res = await fetch(
        `${API}/api/icd11/suggest?q=${encodeURIComponent(diagnosis)}`
      )
      const data = await res.json()
      setIcdResults(Array.isArray(data) ? data.slice(0, 8) : [])
    }, 400)

    return () => clearTimeout(timer)
  }, [diagnosis, diagnosisLocked, API])

  const handleDiagnosisKeyDown = e => {
    if (!icdResults.length) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, icdResults.length - 1))
    }

    if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    }

    if (e.key === "Enter") {
      e.preventDefault()
      selectDiagnosis(icdResults[activeIndex] || icdResults[0])
    }
  }

  const selectDiagnosis = async r => {
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

      setTriage(t => ({ ...t, severity: "HIGH" }))
    }
  }

  /* =========================
     ACTIONS
  ========================== */
  const saveConsultation = async () => {
    if (!selectedICD) {
      alert("Please select a diagnosis")
      return
    }

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
    if (!selectedICD) {
      alert("Diagnosis required before closing consultation")
      return
    }

    setClosing(true)

    await supabase
      .from("consultations")
      .update({
        status: "CLOSED",
        closed_at: new Date().toISOString(),
      })
      .eq("visit_id", visitId)

    await supabase
      .from("visits")
      .update({ status: "COMPLETED" })
      .eq("id", visitId)

    alert("Consultation closed")
    navigate("/opd")
  }

  const admitToIPD = async () => {
    if (!selectedICD) {
      alert("Diagnosis required before admission")
      return
    }

    setClosing(true)

    await supabase.from("ipd_admissions").insert({
      visit_id: visitId,
      patient_id: patient.id,
      admitted_at: new Date().toISOString(),
      status: "ACTIVE",
    })

    await supabase
      .from("consultations")
      .update({
        status: "CLOSED",
        closed_at: new Date().toISOString(),
      })
      .eq("visit_id", visitId)

    await supabase
      .from("visits")
      .update({ status: "ADMITTED" })
      .eq("id", visitId)

    alert("Patient admitted to IPD")
    navigate("/ipd")
  }

  /* =========================
     UI
  ========================== */
  if (loading) return <div>Loading…</div>

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <h2>{visit.visit_no} — {patient.first_name} {patient.last_name}</h2>

      {triage && (
        <div style={{ fontSize: 13 }}>
          Temp {triage.temperature}°C • Pulse {triage.pulse} •
          BP {triage.bp_systolic}/{triage.bp_diastolic} • SpO₂ {triage.spo2}%
        </div>
      )}

      <h3>Consultation</h3>

      <input style={input} placeholder="Chief Complaint"
        value={chiefComplaint}
        onChange={e => setChiefComplaint(e.target.value)} />

      <textarea style={input} placeholder="History of Present Illness"
        value={historyOfPresentIllness}
        onChange={e => setHPI(e.target.value)} />

      <textarea style={input} placeholder="Examination Findings"
        value={examination}
        onChange={e => setExamination(e.target.value)} />

      <h4>Diagnosis (ICD-11)</h4>

      <input
        style={{
          ...input,
          background: hasPendingLabs ? "#f5f5f5" : "#fff",
        }}
        disabled={hasPendingLabs}
        placeholder={
          hasPendingLabs
            ? "Diagnosis locked until labs reviewed"
            : "Type diagnosis (e.g. malaria)"
        }
        value={diagnosis}
        onChange={e => {
          setDiagnosis(e.target.value)
          setSelectedICD(null)
          setDiagnosisLocked(false)
        }}
        onKeyDown={handleDiagnosisKeyDown}
      />

      {icdResults.map((r, i) => (
        <div
          key={r.code}
          onClick={() => selectDiagnosis(r)}
          style={{
            padding: 10,
            cursor: "pointer",
            background: i === activeIndex ? "#eef" : "#fff",
            borderLeft: isDangerDiagnosis(r.title)
              ? "4px solid crimson"
              : "4px solid #ddd",
          }}
        >
          <b>{r.title}</b>
          <div style={{ fontSize: 12 }}>
            ICD-11: {r.code}
          </div>
        </div>
      ))}

      {suggestedLabs.length > 0 && (
        <div>🧠 Suggested labs: {suggestedLabs.join(", ")}</div>
      )}

      <textarea style={input} placeholder="Doctor Notes"
        value={notes}
        onChange={e => setNotes(e.target.value)} />

      <button style={btnPrimary} onClick={saveConsultation}>
        Save Consultation
      </button>

      <h3>Send to Lab</h3>

      {labs.map((l, i) => (
        <input key={i} style={input} value={l}
          placeholder="Lab test"
          onChange={e => {
            const c = [...labs]
            c[i] = e.target.value
            setLabs(c)
          }} />
      ))}

      <button onClick={() => setLabs([...labs, ""])}>+ Add Lab</button>
      <button style={btnPrimary} onClick={sendLab}>Send to Lab</button>

      <h3>Prescription</h3>

      {drugs.map((d, i) => (
        <div key={i}>
          <input style={input} placeholder="Drug"
            value={d.name}
            onChange={e => {
              const c = [...drugs]
              c[i].name = e.target.value
              setDrugs(c)
            }} />
          <input style={input} placeholder="Dose"
            value={d.dose}
            onChange={e => {
              const c = [...drugs]
              c[i].dose = e.target.value
              setDrugs(c)
            }} />
          <input style={input} placeholder="Frequency"
            value={d.frequency}
            onChange={e => {
              const c = [...drugs]
              c[i].frequency = e.target.value
              setDrugs(c)
            }} />
        </div>
      ))}

      <button onClick={() => setDrugs([...drugs, { name: "", dose: "", frequency: "" }])}>
        + Add Drug
      </button>
      <button style={btnPrimary} onClick={sendPrescription}>
        Send to Pharmacy
      </button>

    {showBooking && (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.4)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <div style={{
        background: "#fff",
        padding: 20,
        borderRadius: 12,
        width: 400,
        display: "grid",
        gap: 10
      }}>
        <h3>Book Surgery</h3>

        <input
          style={input}
          placeholder="Procedure Name"
          value={procedure}
          onChange={e => setProcedure(e.target.value)}
        />

        <select
          style={input}
          value={urgency}
          onChange={e => setUrgency(e.target.value)}
        >
          <option value="ELECTIVE">Elective</option>
          <option value="EMERGENCY">Emergency</option>
        </select>

        <input
          type="date"
          style={input}
          value={preferredDate}
          onChange={e => setPreferredDate(e.target.value)}
        />

        <input
          style={input}
          placeholder="Estimated Duration (minutes)"
          value={estimatedDuration}
          onChange={e => setEstimatedDuration(e.target.value)}
        />

        <button style={btnPrimary} onClick={bookForSurgery}>
          Confirm Booking
        </button>

        <button style={btn} onClick={() => setShowBooking(false)}>
          Cancel
        </button>
      </div>
    </div>
  )}

      {/* ✅ FINAL ACTIONS — EXACTLY HERE */}
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button
    style={{ ...btn, background: "#9333ea", color: "#fff" }}
    onClick={() => setShowBooking(true)}
  >
    🏥 Book for Surgery
</button>
        <button
          style={{ ...btn, background: "#0a7", color: "#fff" }}
          disabled={closing}
          onClick={admitToIPD}
        >
          🏥 Admit to IPD
        </button>

    

        <button
          style={{ ...btn, background: "#444", color: "#fff" }}
          disabled={closing}
          onClick={closeConsultation}
        >
          ✅ Close Consultation
        </button>
      </div>

      <button style={btn} onClick={() => navigate("/opd")}>
        ← Back
      </button>
    </div>
  )
}
