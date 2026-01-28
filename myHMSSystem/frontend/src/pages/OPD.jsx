import { useEffect, useState } from "react";
import { getVisits } from "../services/visits";

export default function OPD() {
  const [visits, setVisits] = useState([]);

  useEffect(() => {
    getVisits()
      .then(setVisits)
      .catch(console.error);
  }, []);

  return (
    <div>
      <h2>OPD Visits</h2>

      {visits.length === 0 && <p>No OPD visits</p>}

      {visits.map(v => (
        <div key={v.id} className="card">
          <strong>{v.visit_no}</strong>
          <p>
            Patient: {v.patient?.first_name} {v.patient?.last_name}
          </p>
          <p>Status: {v.status}</p>
        </div>
      ))}
    </div>
  );
}
