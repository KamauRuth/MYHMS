import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "../../services/supabase"

const input = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ddd",
  width: "100%",
  marginBottom: 10
}

export default function CaseDetails() {
  const { caseId } = useParams()

  /* ================= SURGEON ================= */
  const [notes, setNotes] = useState({})

  /* ================= ANESTHESIA ================= */
  const [anesthesia, setAnesthesia] = useState({})
  const [vitals, setVitals] = useState([])
  const [drugs, setDrugs] = useState([])
  const [newVital, setNewVital] = useState({})
  const [newDrug, setNewDrug] = useState({})

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    await loadNotes()
    await loadAnesthesia()
    setLoading(false)
  }

  /* ================= LOAD SURGEON NOTES ================= */

  const loadNotes = async () => {
    const { data } = await supabase
      .from("surgery_notes")
      .select("*")
      .eq("case_id", caseId)
      .maybeSingle()

    setNotes(data || {})
  }

  const saveNotes = async () => {
    const { data: existing } = await supabase
      .from("surgery_notes")
      .select("id")
      .eq("case_id", caseId)
      .maybeSingle()

    if (existing) {
      await supabase
        .from("surgery_notes")
        .update(notes)
        .eq("case_id", caseId)
    } else {
      await supabase
        .from("surgery_notes")
        .insert({ ...notes, case_id: caseId })
    }

    alert("Surgeon notes saved")
  }

  /* ================= LOAD ANESTHESIA ================= */

  const loadAnesthesia = async () => {
    const { data: record } = await supabase
      .from("anesthesia_records")
      .select("*")
      .eq("case_id", caseId)
      .maybeSingle()

    const { data: vitalsRows } = await supabase
      .from("anesthesia_vitals")
      .select("*")
      .eq("case_id", caseId)
      .order("recorded_at", { ascending: true })

    const { data: drugRows } = await supabase
      .from("anesthesia_drugs")
      .select("*")
      .eq("case_id", caseId)
      .order("time_given", { ascending: true })

    setAnesthesia(record || {})
    setVitals(vitalsRows || [])
    setDrugs(drugRows || [])
  }

  const saveAssessment = async () => {
    await supabase
      .from("anesthesia_records")
      .upsert({ ...anesthesia, case_id: caseId })

    alert("Anesthesia assessment saved")
  }

  const addVital = async () => {
    await supabase.from("anesthesia_vitals").insert({
      ...newVital,
      case_id: caseId,
      recorded_at: new Date().toISOString()
    })

    setNewVital({})
    loadAnesthesia()
  }

  const addDrug = async () => {
    await supabase.from("anesthesia_drugs").insert({
      ...newDrug,
      case_id: caseId,
      time_given: new Date().toISOString()
    })

    setNewDrug({})
    loadAnesthesia()
  }

  if (loading) return <div>Loading case...</div>

  return (
    <div style={{ padding: 20, display: "grid", gap: 20 }}>

      {/* ================= SURGEON MODULE ================= */}

      <h2>🧑‍⚕️ Surgeon Documentation</h2>

      <h3>Pre-Operative</h3>

      <textarea style={input} placeholder="Diagnosis"
        value={notes.diagnosis || ""}
        onChange={e => setNotes({ ...notes, diagnosis: e.target.value })}
      />

      <textarea style={input} placeholder="Indication"
        value={notes.indication || ""}
        onChange={e => setNotes({ ...notes, indication: e.target.value })}
      />

      <label>
        <input type="checkbox"
          checked={notes.consent_confirmed || false}
          onChange={e => setNotes({ ...notes, consent_confirmed: e.target.checked })}
        /> Consent Confirmed
      </label>

      <textarea style={input} placeholder="Risks Explained"
        value={notes.risks_explained || ""}
        onChange={e => setNotes({ ...notes, risks_explained: e.target.value })}
      />

      <textarea style={input} placeholder="Pre-Op Plan"
        value={notes.pre_op_plan || ""}
        onChange={e => setNotes({ ...notes, pre_op_plan: e.target.value })}
      />

      <h3>Intra-Operative</h3>

      <textarea style={input} placeholder="Procedure Performed"
        value={notes.procedure_performed || ""}
        onChange={e => setNotes({ ...notes, procedure_performed: e.target.value })}
      />

      <input style={input} placeholder="Incision Type"
        value={notes.incision_type || ""}
        onChange={e => setNotes({ ...notes, incision_type: e.target.value })}
      />

      <textarea style={input} placeholder="Findings"
        value={notes.findings || ""}
        onChange={e => setNotes({ ...notes, findings: e.target.value })}
      />

      <textarea style={input} placeholder="Complications"
        value={notes.complications || ""}
        onChange={e => setNotes({ ...notes, complications: e.target.value })}
      />

      <input type="number" style={input} placeholder="Estimated Blood Loss (ml)"
        value={notes.estimated_blood_loss || ""}
        onChange={e => setNotes({ ...notes, estimated_blood_loss: e.target.value })}
      />

      <textarea style={input} placeholder="Specimens Sent"
        value={notes.specimens_sent || ""}
        onChange={e => setNotes({ ...notes, specimens_sent: e.target.value })}
      />

      <textarea style={input} placeholder="Closure Details"
        value={notes.closure_details || ""}
        onChange={e => setNotes({ ...notes, closure_details: e.target.value })}
      />

      <h3>Post-Operative Orders</h3>

      <textarea style={input} placeholder="Antibiotics"
        value={notes.antibiotics || ""}
        onChange={e => setNotes({ ...notes, antibiotics: e.target.value })}
      />

      <textarea style={input} placeholder="IV Fluids"
        value={notes.iv_fluids || ""}
        onChange={e => setNotes({ ...notes, iv_fluids: e.target.value })}
      />

      <textarea style={input} placeholder="Analgesics"
        value={notes.analgesics || ""}
        onChange={e => setNotes({ ...notes, analgesics: e.target.value })}
      />

      <textarea style={input} placeholder="Monitoring Instructions"
        value={notes.monitoring_instructions || ""}
        onChange={e => setNotes({ ...notes, monitoring_instructions: e.target.value })}
      />

      <button onClick={saveNotes}>Save Surgeon Notes</button>

      {/* ================= ANESTHESIA MODULE ================= */}

      <h2>🫁 Anesthesia Assessment</h2>

      <input style={input} placeholder="ASA Classification"
        value={anesthesia.asa_classification || ""}
        onChange={e => setAnesthesia({ ...anesthesia, asa_classification: e.target.value })}
      />

      <input style={input} placeholder="Airway Assessment"
        value={anesthesia.airway_assessment || ""}
        onChange={e => setAnesthesia({ ...anesthesia, airway_assessment: e.target.value })}
      />

      <textarea style={input} placeholder="Allergies"
        value={anesthesia.allergies || ""}
        onChange={e => setAnesthesia({ ...anesthesia, allergies: e.target.value })}
      />

      <textarea style={input} placeholder="Risk Factors"
        value={anesthesia.risk_factors || ""}
        onChange={e => setAnesthesia({ ...anesthesia, risk_factors: e.target.value })}
      />

      <label>
        <input type="checkbox"
          checked={anesthesia.emergency_flag || false}
          onChange={e => setAnesthesia({ ...anesthesia, emergency_flag: e.target.checked })}
        /> Emergency Case
      </label>

      <button onClick={saveAssessment}>Save Assessment</button>

      <h3>Live Vitals</h3>

      <input style={input} placeholder="BP Systolic"
        onChange={e => setNewVital({ ...newVital, bp_systolic: e.target.value })}
      />
      <input style={input} placeholder="BP Diastolic"
        onChange={e => setNewVital({ ...newVital, bp_diastolic: e.target.value })}
      />
      <input style={input} placeholder="Pulse"
        onChange={e => setNewVital({ ...newVital, pulse: e.target.value })}
      />
      <input style={input} placeholder="SpO2"
        onChange={e => setNewVital({ ...newVital, spo2: e.target.value })}
      />
      <input style={input} placeholder="Temperature"
        onChange={e => setNewVital({ ...newVital, temperature: e.target.value })}
      />
      <input style={input} placeholder="Respiratory Rate"
        onChange={e => setNewVital({ ...newVital, respiratory_rate: e.target.value })}
      />

      <button onClick={addVital}>Add Vital</button>

      {vitals.map(v => (
        <div key={v.id}>
          {new Date(v.recorded_at).toLocaleTimeString()} —
          BP {v.bp_systolic}/{v.bp_diastolic} —
          Pulse {v.pulse} —
          SpO2 {v.spo2}
        </div>
      ))}

      <h3>Anesthesia Drugs</h3>

      <input style={input} placeholder="Drug Name"
        onChange={e => setNewDrug({ ...newDrug, drug_name: e.target.value })}
      />
      <input style={input} placeholder="Dose"
        onChange={e => setNewDrug({ ...newDrug, dose: e.target.value })}
      />
      <input style={input} placeholder="Route"
        onChange={e => setNewDrug({ ...newDrug, route: e.target.value })}
      />

      <button onClick={addDrug}>Log Drug</button>

      {drugs.map(d => (
        <div key={d.id}>
          {new Date(d.time_given).toLocaleTimeString()} —
          {d.drug_name} — {d.dose}
        </div>
      ))}

    </div>
  )
}