import { useEffect, useState } from "react"

export default function OPDStats() {
  const API = import.meta.env.VITE_API_BASE_URL
  const [stats, setStats] = useState({})

  useEffect(() => {
    fetch(`${API}/api/icd11/stats`)
      .then(r => r.json())
      .then(setStats)
  }, [])

  return (
    <div>
      <h2>OPD Disease Stats</h2>
      {Object.entries(stats).map(([k, v]) => (
        <div key={k}>{k}: {v}</div>
      ))}
    </div>
  )
}
