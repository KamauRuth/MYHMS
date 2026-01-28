import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";

import ReceptionDashboard from "./dashboards/ReceptionDashboard";
import TriageDashboard from "./dashboards/TriageDashboard";
import OPDDashboard from "./dashboards/OPDDashboard";

export default function DashboardRoutes() {
  // TEMP (backend role comes next)
  const role = "RECEPTION";

  return (
    <Layout active={role}>
      <Routes>
        {/* INDEX ROUTE (THIS WAS MISSING) */}
        <Route
          index
          element={<Navigate to={defaultRoute(role)} />}
        />

        {role === "RECEPTION" && (
          <Route path="reception" element={<ReceptionDashboard />} />
        )}

        {role === "TRIAGE" && (
          <Route path="triage" element={<TriageDashboard />} />
        )}

        {role === "OPD" && (
          <Route path="opd" element={<OPDDashboard />} />
        )}

        <Route path="*" element={<Navigate to={defaultRoute(role)} />} />
      </Routes>
    </Layout>
  );
}

const defaultRoute = role => {
  switch (role) {
    case "RECEPTION":
      return "reception";
    case "TRIAGE":
      return "triage";
    case "OPD":
      return "opd";
    default:
      return "/login";
  }
};
