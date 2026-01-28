import { useEffect, useState } from "react";
import { getPendingTriage } from "../../services/triage";
import "../styles/global.css";

export default function Triage() {
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    getPendingTriage()
      .then(setQueue)
      .catch(console.error);
  }, []);

  return (
    <div className="triage-page">
      <h2>Triage Queue</h2>

      {queue.map(item => (
        <div key={item.id} className="triage-card">
          {item.patient.first_name} {item.patient.last_name}
        </div>
      ))}
    </div>
  );
}
