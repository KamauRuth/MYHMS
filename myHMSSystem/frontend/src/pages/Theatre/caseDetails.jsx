import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "../../services/supabase"

const input = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ddd",
  width: "100%",
}

export default function CaseDetails() {
  const { caseId } = useParams()

  const [notes, setNotes] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    const { data } = await supabase
      .from("surgery_notes")
      .select("*")
      .eq("case_id", caseId)
      .maybeSingle()

    setNotes(data || {})
    setLoading(false)
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

    alert("Notes saved")
  }

  if (loading) return <div>Loading case...</div>

  return (
    <div style={{ padding: 20 }}>
      <h2>🧑‍⚕️ Surgeon Notes</h2>

      <h3>Pre-Operative</h3>
      <textarea
        style={input}
        placeholder="Diagnosis"
        value={notes.diagnosis || ""}
        onChange={e => setNotes({ ...notes, diagnosis: e.target.value })}
      />

      <textarea
        style={input}
        placeholder="Indication"
        value={notes.indication || ""}
        onChange={e => setNotes({ ...notes, indication: e.target.value })}
      />

      <h3>Intra-Operative</h3>
      <textarea
        style={input}
        placeholder="Procedure performed"
        value={notes.procedure_performed || ""}
        onChange={e =>
          setNotes({ ...notes, procedure_performed: e.target.value })
        }
      />

      <textarea
        style={input}
        placeholder="Findings"
        value={notes.findings || ""}
        onChange={e => setNotes({ ...notes, findings: e.target.value })}
      />

      <textarea
        style={input}
        placeholder="Complications"
        value={notes.complications || ""}
        onChange={e => setNotes({ ...notes, complications: e.target.value })}
      />

      <h3>Post-Operative</h3>
      <textarea
        style={input}
        placeholder="Antibiotics"
        value={notes.antibiotics || ""}
        onChange={e => setNotes({ ...notes, antibiotics: e.target.value })}
      />

      <button onClick={saveNotes}>
        Save Notes
      </button>
    </div>
  )
}