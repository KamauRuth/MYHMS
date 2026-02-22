import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../services/supabase"

const STATUS_COLORS = {
  BOOKED: "#6366f1",
  PREPPED: "#f59e0b",
  IN_THEATRE: "#3b82f6",
  IN_SURGERY: "#9333ea",
  RECOVERY: "#10b981",
  COMPLETED: "#16a34a",
  CANCELLED: "#dc2626",
}

export default function TheatreHome() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadBookings()
  }, [])

  const openCase = async (booking) => {
    const { data: existing } = await supabase
      .from("theatre_cases")
      .select("id")
      .eq("booking_id", booking.id)
      .maybeSingle()

    let caseId

    if (existing) {
      caseId = existing.id
    } else {
      const { data: newCase, error } = await supabase
        .from("theatre_cases")
        .insert({
          booking_id: booking.id,
          case_id: `CASE-${Date.now()}`,
          time_in: new Date().toISOString(),
          final_status: "IN_THEATRE"
        })
        .select()
        .single()

      if (error) {
        console.log(error)
        return
      }

      caseId = newCase.id
    }

    navigate(`/theatre/case/${caseId}`)
  }

  const loadBookings = async () => {
    const { data } = await supabase
      .from("theatre_bookings")
      .select("*")
      .order("preferred_date", { ascending: true })

    const sorted = (data || []).sort((a, b) => {
      if (a.urgency === "EMERGENCY" && b.urgency !== "EMERGENCY") return -1
      if (b.urgency === "EMERGENCY" && a.urgency !== "EMERGENCY") return 1
      return new Date(a.preferred_date) - new Date(b.preferred_date)
    })

    setBookings(sorted)
    setLoading(false)
  }

  const updateStatus = async (booking, newStatus) => {
    await supabase
      .from("theatre_bookings")
      .update({ status: newStatus })
      .eq("id", booking.id)

    if (newStatus === "IN_THEATRE") {
      const { data: existing } = await supabase
        .from("theatre_cases")
        .select("id")
        .eq("booking_id", booking.id)
        .maybeSingle()

      if (!existing) {
        await supabase.from("theatre_cases").insert({
          booking_id: booking.id,
          case_id: `CASE-${Date.now()}`,
          time_in: new Date().toISOString(),
          final_status: "IN_THEATRE",
        })
      }
    }

    if (newStatus === "COMPLETED") {
      await supabase
        .from("theatre_cases")
        .update({
          time_out: new Date().toISOString(),
          final_status: "COMPLETED",
        })
        .eq("booking_id", booking.id)
    }

    loadBookings()
  }

  if (loading) return <div>Loading theatre...</div>

  return (
    <div style={{ padding: 20 }}>
      <h2>Theatre Dashboard</h2>

      {bookings.map(b => (
        <div
          key={b.id}
          style={{
            border: "1px solid #eee",
            padding: 16,
            marginBottom: 12,
            borderLeft: `6px solid ${STATUS_COLORS[b.status]}`,
            background: b.urgency === "EMERGENCY" ? "#fff5f5" : "#fff"
          }}
        >
          <h3>
            {b.procedure_name}
            {b.urgency === "EMERGENCY" && " 🚨"}
          </h3>

          <div>Date: {b.preferred_date}</div>
          <div>Status: {b.status}</div>

          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.keys(STATUS_COLORS).map(status => (
              <button
                key={status}
                onClick={() => updateStatus(b, status)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  background: STATUS_COLORS[status],
                  color: "#fff",
                  opacity: b.status === status ? 1 : 0.6
                }}
              >
                {status}
              </button>
            ))}

            <button
              onClick={() => openCase(b)}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background: "#111",
                color: "#fff"
              }}
            >
              Open Case
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}