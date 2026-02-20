import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../services/supabase"

export default function LabHome() {
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const loadQueue = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("lab_requests")
        .select(`
          id,
          status,
          test_name,
          created_at,
          visit:visits (
            id,
            visit_no,
            patient:patients (
              id,
              first_name,
              last_name,
              patient_no
            )
          )
        `)
        .in("status", ["PENDING", "IN_PROGRESS"])
        .order("created_at", { ascending: true })

      if (error) throw error

      setQueue(data || [])
    } catch (e) {
      console.error("Failed to load lab queue:", e.message)
      setQueue([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQueue()
  }, [])

  const badge = (status) => {
    const base = {
      padding: "4px 8px",
      borderRadius: 999,
      fontSize: 12,
      border: "1px solid #eee",
      background: "#fff",
      textTransform: "capitalize",
    }

    if (status === "PENDING") {
      return <span style={base}>Pending</span>
    }

    if (status === "IN_PROGRESS") {
      return (
        <span style={{ ...base, background: "#111", color: "#fff" }}>
          In Progress
        </span>
      )
    }

    return <span style={base}>{status}</span>
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Laboratory — Queue</h2>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Pending and in-progress tests
          </div>
        </div>

        <button
          onClick={loadQueue}
          disabled={loading}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #eee",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
        {queue.length === 0 ? (
          <div
            style={{
              background: "#fff",
              border: "1px solid #eee",
              borderRadius: 12,
              padding: 14,
              opacity: 0.7,
            }}
          >
            No lab requests right now.
          </div>
        ) : (
          queue.map((l) => (
            <div
              key={l.id}
              style={{
                background: "#fff",
                border: "1px solid #eee",
                borderRadius: 12,
                padding: 14,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 900,
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <span>{l.visit?.visit_no || "Visit"}</span>
                  {badge(l.status)}
                </div>

                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                  {l.visit?.patient?.first_name}{" "}
                  {l.visit?.patient?.last_name} • PatientNo:{" "}
                  {l.visit?.patient?.patient_no || "—"}
                </div>

                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                  Test: <strong>{l.test_name}</strong>
                </div>
              </div>

              <button
                onClick={() => navigate(`/lab/${l.id}`)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #eee",
                  background: "#111",
                  color: "#fff",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Open
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
