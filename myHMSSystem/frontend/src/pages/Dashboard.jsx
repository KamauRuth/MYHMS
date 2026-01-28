import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios"; // adjust if your axios file path differs

const Card = ({ title, value, to, hint }) => (
  <Link
    to={to}
    style={{
      textDecoration: "none",
      color: "#111",
      border: "1px solid #eee",
      borderRadius: 14,
      padding: 14,
      display: "block",
      background: "#fff",
    }}
  >
    <div style={{ fontSize: 12, opacity: 0.7 }}>{title}</div>
    <div style={{ fontSize: 26, fontWeight: 800, margin: "6px 0" }}>{value}</div>
    <div style={{ fontSize: 12, opacity: 0.7 }}>{hint}</div>
  </Link>
);

function Dashboard() {
  const [triageCount, setTriageCount] = useState(0);
  const [doctorCount, setDoctorCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadCounts = async () => {
    try {
      setLoading(true);
      const [triageRes, opdRes] = await Promise.all([
        api.get("/triage/queue"),
        api.get("/opd/queue"),
      ]);

      setTriageCount(Array.isArray(triageRes.data) ? triageRes.data.length : 0);
      setDoctorCount(Array.isArray(opdRes.data) ? opdRes.data.length : 0);
    } catch (e) {
      // If endpoints not ready yet, keep 0
      setTriageCount(0);
      setDoctorCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCounts();
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Welcome</div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>
            Track today’s patient flow: Reception → Triage → OPD.
          </div>
        </div>

        <button
          onClick={loadCounts}
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

      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        <Card
          title="Waiting Triage"
          value={triageCount}
          to="/triage"
          hint="Queue: WAITING_TRIAGE"
        />
        <Card
          title="Waiting Doctor"
          value={doctorCount}
          to="/opd"
          hint="Queue: WAITING_DOCTOR"
        />
        <Card
          title="Reception"
          value="→"
          to="/reception"
          hint="Register / create visits"
        />
        <Card
          title="Billing"
          value="→"
          to="/billing"
          hint="Invoices & payments"
        />
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Quick Links</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link to="/reception">Reception</Link>
          <span>•</span>
          <Link to="/triage">Triage</Link>
          <span>•</span>
          <Link to="/opd">OPD</Link>
          <span>•</span>
          <Link to="/lab">Lab</Link>
          <span>•</span>
          <Link to="/pharmacy">Pharmacy</Link>
          <span>•</span>
          <Link to="/ipd">IPD</Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;