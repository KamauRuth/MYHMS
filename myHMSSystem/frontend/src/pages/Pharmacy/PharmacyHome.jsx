import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function PharmacyHome() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadQueue = async () => {
    try {
      setLoading(true);
      const res = await api.get("/pharmacy/queue");
      setQueue(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setQueue([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0 }}>Pharmacy — Queue</h2>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Prescriptions pending dispensing</div>
        </div>

        <button
          onClick={loadQueue}
          disabled={loading}
          style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #eee", background: "#fff" }}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
        {queue.length === 0 ? (
          <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: 14, opacity: 0.7 }}>
            No pending prescriptions.
          </div>
        ) : (
          queue.map((rx) => (
            <div
              key={rx._id}
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
                <div style={{ fontWeight: 900 }}>
                  {rx.visit?.visitNo || "Visit"} — {rx.patient?.firstName} {rx.patient?.lastName}
                </div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  PatientNo: {rx.patient?.patientNo || "—"} • Drugs: {rx.medications?.length || 0} • Prescriber:{" "}
                  {rx.prescribedBy?.name || "—"}
                </div>
              </div>

              <button
                onClick={() => navigate(`/pharmacy/${rx._id}`)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #eee",
                  background: "#111",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Dispense
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
