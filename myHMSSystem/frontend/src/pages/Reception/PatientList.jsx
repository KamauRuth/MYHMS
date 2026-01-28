import { useEffect, useState } from "react"
import { supabase } from "../../services/supabase"

function PatientList() {
  const [q, setQ] = useState("")
  const [patients, setPatients] = useState([])
  const [error, setError] = useState("")
  const [creatingVisitId, setCreatingVisitId] = useState(null)

  const fetchPatients = async () => {
    setError("")

    let query = supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false })

    if (q) {
      query = query.or(
        `first_name.ilike.%${q}%,last_name.ilike.%${q}%,patient_no.ilike.%${q}%,phone.ilike.%${q}%`
      )
    }

    const { data, error } = await query

    if (error) {
      setError(error.message)
    } else {
      setPatients(data || [])
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  const createVisit = async (patientId, visitType) => {
    try {
      setCreatingVisitId(patientId)

      const { error } = await supabase.from("visits").insert({
        patient_id: patientId,
        visit_type: visitType,
        status: "TRIAGE",
      })

      if (error) throw error

      alert(`Visit created (${visitType})`)
    } catch (err) {
      alert(err.message)
    } finally {
      setCreatingVisitId(null)
    }
  }

  return (
    <div>
      <h3>Patient List</h3>

      <div style={{ display: "flex", gap: 10, margin: "10px 0" }}>
        <input
          placeholder="Search by name, phone, or patient number"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button onClick={fetchPatients}>Search</button>
      </div>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <table width="100%" cellPadding="8">
        <thead>
          <tr>
            <th>Patient No</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Gender</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((p) => (
            <tr key={p.id}>
              <td>{p.patient_no}</td>
              <td>{p.first_name} {p.last_name}</td>
              <td>{p.phone || "-"}</td>
              <td>{p.gender}</td>
              <td>
                <button
                  disabled={creatingVisitId === p.id}
                  onClick={() => createVisit(p.id, "OPD")}
                >
                  Send OPD
                </button>
                <button
                  disabled={creatingVisitId === p.id}
                  onClick={() => createVisit(p.id, "IPD")}
                >
                  Admit IPD
                </button>
              </td>
            </tr>
          ))}

          {patients.length === 0 && (
            <tr>
              <td colSpan="5">No patients found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default PatientList
