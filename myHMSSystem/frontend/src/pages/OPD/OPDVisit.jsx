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
  "typhoid fever",
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
  DANGER_KEYWORDS.some(k =>
    title.toLowerCase().includes(k)
  )

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

  /* LAB + PHARMACY */
  const [labs, setLabs] = useState([""])
  const [drugs, setDrugs] = useState([{ name: "", dose: "", frequency: "" }])

  /* =========================
     LOAD VISIT + TRIAGE + HISTORY
  ========================== */
  useEffect(() => {
    const load = async () => {
      setLoading(true)

      const { data: visitData, error: visitErr } = await supabase
        .from("visits")
        .select(`
          id,
          visit_no,
          patient_id,
          patient:patients (
            id,
            patient_no,
            first_name,
            last_name,
            gender
          )
        `)
        .eq("id", visitId)
        .single()

      if (visitErr || !visitData) {
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

      const { data: lastConsult } = await supabase
        .from("consultations")
        .select("*")
        .eq("patient_id", visitData.patient.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      setVisit(visitData)
      setPatient(visitData.patient)
      setTriage(triageData)

      if (lastConsult) {
        setChiefComplaint(lastConsult.chief_complaint || "")
        setHPI(lastConsult.history_of_present_illness || "")
        setExamination(lastConsult.examination || "")
      }

      setLoading(false)
    }

    load()
  }, [visitId, navigate])

  /* =========================
     WHO ICD-11 SEARCH
  ========================== */
  useEffect(() => {
    if (diagnosis.trim().length < 3) {
      setIcdResults([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API}/api/icd11/search?q=${encodeURIComponent(diagnosis)}`
        )

        if (!res.ok) throw new Error("ICD search failed")

        const data = await res.json()

        const cleaned = (Array.isArray(data) ? data : [])
          .filter(d =>
            d.code &&
            d.title &&
            !d.title.toLowerCase().includes("vaccine") &&
            !d.title.toLowerCase().includes("screening") &&
            !d.title.toLowerCase().includes("history of")
          )
          .slice(0, 8)

        setIcdResults(cleaned)
      } catch (err) {
        console.warn("ICD-11 error:", err.message)
        setIcdResults([])
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [diagnosis, API])

  /* =========================
     ACTIONS
  ========================== */
  const saveConsultation = async () => {
    if (!selectedICD) {
      alert("Please select a diagnosis from the list")
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

    await supabase.from("lab_requests").insert({
      visit_id: visitId,
      tests: clean,
    })

    alert("Sent to lab")
    navigate("/opd")
  }

  const sendPrescription = async () => {
    const clean = drugs.filter(d => d.name)
    if (!clean.length) return alert("Add medication")

    await supabase.from("prescriptions").insert({
      visit_id: visitId,
      medications: clean,
    })

    alert("Sent to pharmacy")
    navigate("/opd")
  }

  /* =========================
     UI
  ========================== */
  if (loading) return <div>Loading…</div>

  return (
    <div style={{ display: "grid", gap: 14 }}>

      <h2>{visit.visit_no} — {patient.first_name} {patient.last_name}</h2>

      {triage?.severity === "HIGH" && (
        <div style={{ background: "#ffe5e5", padding: 10, borderRadius: 8 }}>
          🚨 HIGH SEVERITY — PRIORITY PATIENT
        </div>
      )}

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
        style={input}
        placeholder="Type diagnosis (e.g. malaria)"
        value={diagnosis}
        onChange={e => {
          setDiagnosis(e.target.value)
          setSelectedICD(null)
        }}
      />

      {icdResults.map(r => {
        const danger = isDangerDiagnosis(r.title)
        return (
          <div
            key={r.code}
            onClick={() => {
              setDiagnosis(r.title)
              setSelectedICD(r)
              setIcdResults([])
            }}
            style={{
              padding: "10px",
              cursor: "pointer",
              background: danger ? "#fff1f1" : "#fff",
              borderLeft: danger ? "4px solid crimson" : "4px solid #ddd",
            }}
          >
            <b>{r.title}</b>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              ICD-11: {r.code}
              {danger && " ⚠ HIGH-RISK"}
            </div>
          </div>
        )
      })}

      <textarea style={input} placeholder="Doctor Notes"
        value={notes}
        onChange={e => setNotes(e.target.value)} />

      <button style={btnPrimary} onClick={saveConsultation}>
        Save Consultation
      </button>

      <h3>Send to Lab</h3>
      {labs.map((l, i) => (
        <input key={`lab-${i}`} style={input} value={l}
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
        <div key={`drug-${i}`} style={{ display: "grid", gap: 6 }}>
          <input style={input} placeholder="Drug"
            value={d.name}
            onChange={e => {
              const c = [...drugs]; c[i].name = e.target.value; setDrugs(c)
            }} />
          <input style={input} placeholder="Dose"
            value={d.dose}
            onChange={e => {
              const c = [...drugs]; c[i].dose = e.target.value; setDrugs(c)
            }} />
          <input style={input} placeholder="Frequency"
            value={d.frequency}
            onChange={e => {
              const c = [...drugs]; c[i].frequency = e.target.value; setDrugs(c)
            }} />
        </div>
      ))}
      <button onClick={() => setDrugs([...drugs, { name: "", dose: "", frequency: "" }])}>
        + Add Drug
      </button>
      <button style={btnPrimary} onClick={sendPrescription}>
        Send to Pharmacy
      </button>

      <button style={btn} onClick={() => navigate("/opd")}>← Back</button>
    </div>
  )
}
