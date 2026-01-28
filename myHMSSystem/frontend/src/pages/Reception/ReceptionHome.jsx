import { useState } from "react"
import RegisterPatient from "./RegisterPatient"
import PatientList from "./PatientList"
import Queue from "./Queue"

function ReceptionHome() {
  const [tab, setTab] = useState("register")

  return (
    <div>
      <h2>Reception</h2>

      <div style={{ display: "flex", gap: 10, margin: "12px 0" }}>
        <button onClick={() => setTab("register")}>Register Patient</button>
        <button onClick={() => setTab("patients")}>Patient List</button>
        <button onClick={() => setTab("queue")}>Today Queue</button>
      </div>

      <div style={{ marginTop: 16 }}>
        {tab === "register" && <RegisterPatient />}
        {tab === "patients" && <PatientList />}
        {tab === "queue" && <Queue />}
      </div>
    </div>
  )
}

export default ReceptionHome
