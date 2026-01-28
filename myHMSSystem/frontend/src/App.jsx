import { Routes, Route, Navigate } from "react-router-dom"

// paths must match folders EXACTLY
import Login from "./pages/auth/Login"
import TriageHome from "./pages/Triage/TriageHome"
import ReceptionHome from "./pages/Reception/ReceptionHome"
import OPDHome from "./pages/OPD/OPDHome"
import OPDVisit from "./pages/OPD/OPDVisit"

function App() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/login" element={<Login />} />

      {/* DEFAULT */}
      <Route path="/" element={<Navigate to="/triage" replace />} />

      {/* TRIAGE */}
      <Route path="/triage" element={<TriageHome />} />

      {/* RECEPTION */}
      <Route path="/reception" element={<ReceptionHome />} />

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/triage" replace />} />


      {/* OPD */}
      <Route path="/opd" element={<OPDHome />} />
      <Route path="/opd/:visitId" element={<OPDVisit />} />
    </Routes>
  )
}

export default App
