import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";

const btn = { padding: "10px 12px", borderRadius: 10, border: "1px solid #eee", background: "#fff", cursor: "pointer" };
const btnPrimary = { ...btn, background: "#111", color: "#fff" };

export default function PharmacyDispense() {
  const { rxId } = useParams();
  const navigate = useNavigate();

  const [rx, setRx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dispensing, setDispensing] = useState(false);

  const shortId = useMemo(() => (rxId ? rxId.slice(-6) : ""), [rxId]);

  const loadRx = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/pharmacy/${rxId}`);
      setRx(res.data);
    } catch (e) {
      setRx(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRx();
  }, [rxId]);

  const dispense = async () => {
    try {
      setDispensing(true);
      await api.patch(`/pharmacy/${rxId}/dispense`);
      alert("Dispensed ✅");
      navigate("/pharmacy");
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to dispense");
    } finally {
      setDispensing(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!rx) return <div>Prescription #{shortId} not found</div>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div>
          <h2 style={{ margin: 0 }}>Dispense Prescription</h2>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {rx.visit?.visitNo || "Visit"} — {rx.patient?.firstName} {rx.patient?.lastName} • Dispensed:{" "}
            <strong>{String(rx.dispensed)}</strong>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => navigate("/pharmacy")} style={btn}>
            ← Back
          </button>

          <button onClick={dispense} disabled={dispensing || rx.dispensed} style={btnPrimary}>
            {dispensing ? "Saving..." : rx.dispensed ? "Already dispensed" : "Mark as Dispensed"}
          </button>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
        <div style={{ fontWeight: 900 }}>Patient</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>
          PatientNo: <strong>{rx.patient?.patientNo}</strong> • Phone: {rx.patient?.phone || "-"} • Gender:{" "}
          {rx.patient?.gender || "-"}
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
        <div style={{ fontWeight: 900 }}>Medications</div>

        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
          {(rx.medications || []).map((m, idx) => (
            <div key={idx} style={{ border: "1px solid #eee", borderRadius: 12, padding: 10 }}>
              <div style={{ fontWeight: 800 }}>{m.name}</div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                Dose: {m.dose || "-"} • Freq: {m.frequency || "-"} • Route: {m.route || "-"} • Duration:{" "}
                {m.duration || "-"}
              </div>
              {m.instructions ? <div style={{ fontSize: 13, marginTop: 4 }}>Instructions: {m.instructions}</div> : null}
            </div>
          ))}
        </div>

        {rx.notes ? <div style={{ marginTop: 10, fontSize: 13, opacity: 0.8 }}>Notes: {rx.notes}</div> : null}
      </div>
    </div>
  );
}
