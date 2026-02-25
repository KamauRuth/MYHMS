import { useEffect, useState, useCallback, useRef } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "../../services/supabase"

const containerStyle = {
  padding: 24,
  display: "grid",
  gap: 24,
  background: "#f8fafc",
  minHeight: "100vh"
}

const panelStyle = {
  background: "#fff",
  padding: 20,
  borderRadius: 12,
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  display: "grid",
  gap: 12
}

const inputStyle = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ddd",
  width: "100%"
}

export default function CaseDetails({ currentUser }) {
  const { caseId } = useParams()

  const [caseData, setCaseData] = useState(null)
  const [notes, setNotes] = useState({})
  const [anesthesia, setAnesthesia] = useState({})
  const [billing, setBilling] = useState({})
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const saveTimeout = useRef(null)

  /* ================= LOAD DATA ================= */

  const loadAll = useCallback(async () => {
    setLoading(true)

    const [
      { data: caseRow },
      { data: notesRow },
      { data: anesthesiaRow },
      { data: billingRow },
      { data: auditRows }
    ] = await Promise.all([
      supabase.from("theatre_cases").select("*").eq("id", caseId).single(),
      supabase.from("surgery_notes").select("*").eq("case_id", caseId).maybeSingle(),
      supabase.from("anesthesia_records").select("*").eq("case_id", caseId).maybeSingle(),
      supabase.from("theatre_billing").select("*").eq("case_id", caseId).maybeSingle(),
      supabase.from("theatre_audit_logs").select("*").eq("case_id", caseId).order("created_at", { ascending: false })
    ])

    setCaseData(caseRow)
    setNotes(notesRow || {})
    setAnesthesia(anesthesiaRow || {})
    setBilling(billingRow || {})
    setAuditLogs(auditRows || [])

    setLoading(false)
  }, [caseId])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  /* ================= REALTIME ================= */

  useEffect(() => {
    const channel = supabase
      .channel("theatre-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "theatre_cases", filter: `id=eq.${caseId}` },
        () => loadAll()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [caseId, loadAll])

  /* ================= AUTO SAVE ================= */

  const autoSave = (table, payload) => {
    clearTimeout(saveTimeout.current)

    saveTimeout.current = setTimeout(async () => {
      await supabase.from(table).upsert({
        case_id: caseId,
        ...payload
      })
    }, 500)
  }

  /* ================= WORKFLOW ================= */

  const transitionStatus = async (newStatus) => {
    if (!currentUser) return
    setActionLoading(true)

    const { error } = await supabase.rpc("transition_theatre_case", {
      p_case_id: caseId,
      p_new_status: newStatus,
      p_user: currentUser.id
    })

    if (error) {
      alert(error.message)
    } else {
      loadAll()
    }

    setActionLoading(false)
  }

  const finalizeCase = async () => {
    setActionLoading(true)

    const { error } = await supabase.rpc("finalize_theatre_case", {
      p_case_id: caseId,
      p_user: currentUser.id
    })

    if (error) {
      alert(error.message)
    } else {
      loadAll()
    }

    setActionLoading(false)
  }

  /* ================= ROLE PROTECTION ================= */

  const isSurgeon = currentUser?.role === "SURGEON"
  const isAnesthetist = currentUser?.role === "ANESTHETIST"
  const isAdmin = currentUser?.role === "ADMIN"

  const locked = caseData?.final_status === "CLOSED"

  if (loading) return <div style={{ padding: 40 }}>Loading case...</div>

  return (
    <div style={containerStyle}>
      {/* HEADER */}
      <div style={panelStyle}>
        <h2>Theatre Case</h2>
        <div><strong>Status:</strong> {caseData.final_status}</div>
        <div><strong>Duration:</strong> {caseData.duration_minutes || 0} mins</div>
        <div><strong>Version:</strong> {caseData.version}</div>
      </div>

      {/* WORKFLOW ACTIONS */}
      {!locked && (
        <div style={panelStyle}>
          <h3>Workflow Actions</h3>

          <button disabled={actionLoading} onClick={() => transitionStatus("IN_SURGERY")}>
            Start Surgery
          </button>

          <button disabled={actionLoading} onClick={() => transitionStatus("COMPLETED")}>
            Complete Surgery
          </button>

          <button disabled={actionLoading} onClick={() => transitionStatus("RECOVERY")}>
            Move to Recovery
          </button>

          <button disabled={actionLoading} onClick={() => transitionStatus("TRANSFERRED")}>
            Transfer to Ward
          </button>

          {isAdmin && (
            <button disabled={actionLoading} onClick={finalizeCase}>
              Finalize & Lock Case
            </button>
          )}
        </div>
      )}

      {/* SURGEON PANEL */}
      <div style={panelStyle}>
        <h3>Surgeon Documentation</h3>

        <textarea
          style={inputStyle}
          disabled={!isSurgeon || locked}
          placeholder="Diagnosis"
          value={notes.diagnosis || ""}
          onChange={(e) => {
            const updated = { ...notes, diagnosis: e.target.value }
            setNotes(updated)
            autoSave("surgery_notes", updated)
          }}
        />

        <textarea
          style={inputStyle}
          disabled={!isSurgeon || locked}
          placeholder="Procedure Performed"
          value={notes.procedure_performed || ""}
          onChange={(e) => {
            const updated = { ...notes, procedure_performed: e.target.value }
            setNotes(updated)
            autoSave("surgery_notes", updated)
          }}
        />

        <label>
          <input
            type="checkbox"
            disabled={!isSurgeon || locked}
            checked={notes.consent_confirmed || false}
            onChange={(e) => {
              const updated = { ...notes, consent_confirmed: e.target.checked }
              setNotes(updated)
              autoSave("surgery_notes", updated)
            }}
          />
          Consent Confirmed
        </label>
      </div>

      {/* ANESTHESIA PANEL */}
      <div style={panelStyle}>
        <h3>Anesthesia</h3>

        <input
          style={inputStyle}
          disabled={!isAnesthetist || locked}
          placeholder="ASA Classification"
          value={anesthesia.asa_classification || ""}
          onChange={(e) => {
            const updated = { ...anesthesia, asa_classification: e.target.value }
            setAnesthesia(updated)
            autoSave("anesthesia_records", updated)
          }}
        />
      </div>

      {/* BILLING PANEL */}
      <div style={panelStyle}>
        <h3>Billing Summary</h3>
        <div>Total: {billing.total_amount || 0}</div>
        <div>Surgeon Commission: {billing.commission_surgeon || 0}</div>
        <div>Anesthesia Commission: {billing.commission_anesthesia || 0}</div>
        <div>Locked: {billing.locked ? "Yes" : "No"}</div>
      </div>

      {/* AUDIT LOG */}
      <div style={panelStyle}>
        <h3>Audit Trail</h3>
        {auditLogs.map((log) => (
          <div key={log.id}>
            <strong>{log.action}</strong> — {log.performed_by} — {new Date(log.created_at).toLocaleString()}
          </div>
        ))}
      </div>
    </div>
  )
}