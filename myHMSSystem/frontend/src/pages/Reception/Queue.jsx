import { useEffect, useState } from "react"
import { supabase } from "../../services/supabase"

function Queue() {
  const [visits, setVisits] = useState([])
  const [error, setError] = useState("")

  const load = async () => {
    setError("")

    const { data, error } = await supabase
      .from("visits")
      .select(`
        id,
        visit_type,
        status,
        created_at,
        patient:patients (
          patient_no,
          first_name,
          last_name
        )
      `)
      .gte("created_at", new Date().toISOString().split("T")[0])
      .order("created_at", { ascending: false })

    if (error) {
      setError("Failed to load queue")
    } else {
      setVisits(data || [])
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div>
      <h3>Today Queue</h3>
      <button onClick={load}>Refresh</button>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <table width="100%" cellPadding="8">
        <thead>
          <tr>
            <th>Time</th>
            <th>Patient</th>
            <th>Type</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {visits.map((v) => (
            <tr key={v.id}>
              <td>{new Date(v.created_at).toLocaleTimeString()}</td>
              <td>
                {v.patient?.patient_no} — {v.patient?.first_name} {v.patient?.last_name}
              </td>
              <td>{v.visit_type}</td>
              <td>{v.status}</td>
            </tr>
          ))}

          {visits.length === 0 && (
            <tr>
              <td colSpan="4">No visits today.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default Queue
