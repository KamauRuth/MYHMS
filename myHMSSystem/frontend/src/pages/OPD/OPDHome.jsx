import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../services/supabase"

const pillStyle = (status) => ({
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 12,
  border: "1px solid #eee",
  background: "#fff",
  fontWeight: status === "IN_PROGRESS" ? 700 : 400,
})

const statusLabel = (s) => {
  if (s === "WAITING_DOCTOR") return "Waiting Doctor"
  if (s === "IN_PROGRESS") return "In Progress"
  if (s === "WAITING_LAB_RESULTS") return "Waiting Lab"
  if (s === "COMPLETED") return "Completed"
  return s || "—"
}

export default function OPDHome() {
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchQueue = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from("visits")
        .select(`
          id,
          visit_no,
          status,
          created_at,
          patient:patients (
            patient_no,
            first_name,
            last_name
          )
        `)
        .eq("visit_type", "OPD")
        .in("status", ["WAITING_DOCTOR", "IN_PROGRESS", "WAITING_LAB_RESULTS"])
        .order("created_at", { ascending: true })

      if (error) {
        console.error(error)
        alert("Failed to load OPD queue")
      } else {
        setQueue(data || [])
      }

      setLoading(false)
    }

    fetchQueue()
  }, [])

  return (
    <div>
      <h2>OPD — Doctor Worklist</h2>

      <button
        onClick={() => window.location.reload()}
        disabled={loading}
      >
        {loading ? "Refreshing..." : "Refresh"}
      </button>

      <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
        {queue.length === 0 && (
          <div style={{ opacity: 0.7 }}>
            No patients in OPD queue.
          </div>
        )}

        {queue.map((v) => (
          <div
            key={v.id}
            style={{
              border: "1px solid #eee",
              borderRadius: 12,
              padding: 14,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 700 }}>
                {v.visit_no} — {v.patient?.first_name} {v.patient?.last_name}
              </div>

              <div style={{ fontSize: 12, opacity: 0.8 }}>
                PatientNo: {v.patient?.patient_no || "—"}
              </div>

              <span style={pillStyle(v.status)}>
                {statusLabel(v.status)}
              </span>
            </div>

            <button
              onClick={() => navigate(`/opd/${v.id}`)}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #eee",
                background: "#111",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Open
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
