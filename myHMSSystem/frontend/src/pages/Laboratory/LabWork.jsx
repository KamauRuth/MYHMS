import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { supabase } from "../../services/supabase"

const inputStyle = {
  padding: 10,
  borderRadius: 10,
  border: "1px solid #eee",
  width: "100%",
}

const btn = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #eee",
  background: "#fff",
  cursor: "pointer",
}

const btnPrimary = { ...btn, background: "#111", color: "#fff" }

export default function LabWork() {
  const { labId } = useParams()
  const navigate = useNavigate()

  const [lab, setLab] = useState(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingBack, setSavingBack] = useState(false)

  const [results, setResults] = useState([])

  const shortId = useMemo(() => (labId ? labId.slice(-6) : ""), [labId])

  const buildEmptyResults = (testName) => [
    {
      test: testName,
      result: "",
      unit: "",
      refRange: "",
      remarks: "",
    },
  ]

  /* =========================
     LOAD LAB REQUEST
  ========================== */
  const loadLab = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("lab_requests")
        .select(`
          id,
          test_name,
          status,
          results,
          created_at,
          completed_at,
          visit:visits (
            id,
            visit_no,
            patient:patients (
              id,
              first_name,
              last_name
            )
          )
        `)
        .eq("id", labId)
        .single()

      if (error) throw error

      setLab(data)

      if (Array.isArray(data.results) && data.results.length > 0) {
        setResults(
          data.results.map((r) => ({
            test: r.test || data.test_name,
            result: r.result || "",
            unit: r.unit || "",
            refRange: r.refRange || "",
            remarks: r.remarks || "",
          }))
        )
      } else {
        setResults(buildEmptyResults(data.test_name))
      }
    } catch (e) {
      console.error("Failed to load lab:", e.message)
      setLab(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLab()
  }, [labId])

  /* =========================
     START LAB
  ========================== */
  const startLab = async () => {
    try {
      setStarting(true)

      await supabase
        .from("lab_requests")
        .update({ status: "IN_PROGRESS" })
        .eq("id", labId)

      alert("Lab started")
      await loadLab()
    } catch (e) {
      alert("Failed to start lab")
    } finally {
      setStarting(false)
    }
  }

  /* =========================
     SAVE RESULTS
  ========================== */
  const saveResults = async () => {
    const cleaned = results.map((r) => ({
      test: r.test,
      result: (r.result || "").trim(),
      unit: (r.unit || "").trim(),
      refRange: (r.refRange || "").trim(),
      remarks: (r.remarks || "").trim(),
    }))

    const hasAbnormal = cleaned.some((r) =>
      r.remarks.toLowerCase().includes("abnormal")
    )

    await supabase
      .from("lab_requests")
      .update({
        results: cleaned,
        is_abnormal: hasAbnormal,
        status: "DONE",
        completed_at: new Date().toISOString(),
      })
      .eq("id", labId)
  }

  /* =========================
     COMPLETE (STAY)
  ========================== */
  const completeLabStay = async () => {
    try {
      setSaving(true)
      await saveResults()
      alert("Results saved. You can now download the report.")
      await loadLab()
    } catch (e) {
      alert("Failed to complete lab")
    } finally {
      setSaving(false)
    }
  }

  /* =========================
     COMPLETE (BACK)
  ========================== */
  const completeLabAndBack = async () => {
    try {
      setSavingBack(true)
      await saveResults()
      alert("Results saved and sent back to doctor")
      navigate("/lab")
    } catch (e) {
      alert("Failed to complete lab")
    } finally {
      setSavingBack(false)
    }
  }

  if (loading) return <div>Loading…</div>
  if (!lab) return <div>Lab request #{shortId} not found.</div>

  const canDownload = lab.status === "DONE"

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Lab Work</h2>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {lab.visit?.visit_no} —{" "}
            {lab.visit?.patient?.first_name}{" "}
            {lab.visit?.patient?.last_name} • Status:{" "}
            <strong>{lab.status}</strong>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => navigate("/lab")} style={btn}>
            ← Back
          </button>

          <button
            onClick={startLab}
            disabled={starting || lab.status !== "PENDING"}
            style={btn}
          >
            {starting ? "Starting…" : "Start"}
          </button>

          <button onClick={completeLabStay} disabled={saving} style={btnPrimary}>
            {saving ? "Saving…" : "Save Results"}
          </button>

          <button
            onClick={completeLabAndBack}
            disabled={savingBack}
            style={btn}
          >
            {savingBack ? "Saving…" : "Save & Back"}
          </button>
        </div>
      </div>

      {/* Downloads */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          style={btn}
          disabled={!canDownload}
          onClick={() =>
            window.open(
              `${import.meta.env.VITE_API_BASE_URL}/api/labs/${lab.id}/pdf`,
              "_blank"
            )
          }
        >
          Download PDF
        </button>
      </div>

      {/* Requested Test */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 14,
        }}
      >
        <div style={{ fontWeight: 900 }}>Requested Test</div>
        <div style={{ marginTop: 6, fontSize: 13 }}>
          <strong>{lab.test_name}</strong>
        </div>
      </div>

      {/* Results Entry */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 14,
        }}
      >
        <div style={{ fontWeight: 900 }}>Enter Results</div>

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {results.map((r, idx) => (
            <div
              key={idx}
              style={{
                border: "1px solid #eee",
                borderRadius: 12,
                padding: 10,
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 8 }}>
                {r.test}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr",
                  gap: 8,
                }}
              >
                <input
                  placeholder="Result"
                  value={r.result}
                  onChange={(e) => {
                    const copy = [...results]
                    copy[idx] = { ...copy[idx], result: e.target.value }
                    setResults(copy)
                  }}
                  style={inputStyle}
                />
                <input
                  placeholder="Unit"
                  value={r.unit}
                  onChange={(e) => {
                    const copy = [...results]
                    copy[idx] = { ...copy[idx], unit: e.target.value }
                    setResults(copy)
                  }}
                  style={inputStyle}
                />
                <input
                  placeholder="Ref range"
                  value={r.refRange}
                  onChange={(e) => {
                    const copy = [...results]
                    copy[idx] = { ...copy[idx], refRange: e.target.value }
                    setResults(copy)
                  }}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginTop: 8 }}>
                <input
                  placeholder="Remarks"
                  value={r.remarks}
                  onChange={(e) => {
                    const copy = [...results]
                    copy[idx] = { ...copy[idx], remarks: e.target.value }
                    setResults(copy)
                  }}
                  style={inputStyle}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
