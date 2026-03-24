"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useParams } from "next/navigation"

// Your tab components
import ConsultationTab from "../../tabs/ConsultationTab"
import OdontogramTab from "../../tabs/OdontogramTab"
import ProceduresTab from "../../tabs/ProceduresTab"

const supabase = createClient()

export default function DentalVisitPage() {
  const { id } = useParams() // visit ID from URL
  const [visit, setVisit] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("Consultation")

  useEffect(() => {
    if (!id) {
      console.error("No visit ID provided in URL")
      return
    }
    fetchVisit()
  }, [id])

  const fetchVisit = async () => {
    const { data, error } = await supabase
      .from("visits")
      .select(`
        *,
        patients(first_name, last_name, phone),
        dental_visits(status)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error(error)
      return
    }

    setVisit(data)
  }

  const updateStatus = async (status: string) => {
    if (!id) return
    const { error } = await supabase
      .from("visits")
      .update({ status })
      .eq("id", id)

    if (error) console.error(error)
    fetchVisit()
  }

  if (!visit) return <p>Loading...</p>

  return (
    <div className="p-6 space-y-6">
      {/* 🔹 PATIENT HEADER */}
      <div className="bg-white p-4 rounded-xl shadow flex justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {visit.patients?.first_name} {visit.patients?.last_name}
          </h2>
          <p className="text-sm text-gray-500">Phone: {visit.patients?.phone}</p>
          <p className="text-sm text-gray-500">
            Visit Date: {new Date(visit.created_at).toLocaleString()}
          </p>
          <p className="text-sm">
            Status: <span className="capitalize">{visit.status}</span>
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => updateStatus("in-chair")}
            className="px-3 py-1 bg-blue-500 text-white rounded"
          >
            In Chair
          </button>

          <button
            onClick={() => updateStatus("completed")}
            className="px-3 py-1 bg-green-600 text-white rounded"
          >
            Complete
          </button>
        </div>
      </div>

      {/* 🔹 TABS */}
      <div className="flex gap-4 border-b pb-2">
        {["Consultation", "Odontogram", "Procedures"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`capitalize ${
              activeTab === tab
                ? "border-b-2 border-blue-500 font-semibold"
                : "text-gray-500"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 🔹 TAB CONTENT */}
      <div>
        {activeTab === "Consultation" && <ConsultationTab visit={visit} />}
        {activeTab === "Odontogram" && <OdontogramTab visitId={visit.id} />}
        {activeTab === "Procedures" && <ProceduresTab visit={visit} />}
      </div>
    </div>
  )
}