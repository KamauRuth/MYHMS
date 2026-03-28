"use client"

import { Dialog } from "@/components/ui/dialog"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

const generateVisitNo = () => {
  return `OPD-${new Date().getFullYear()}-${Math.floor(
    100000 + Math.random() * 900000
  )}`
}

export default function ViewPatients() {

  const [patients, setPatients] = useState<any[]>([])
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [services, setServices] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState<any>(null)

  const [form, setForm] = useState({
    service: "",
    payment_method: ""
  })

  useEffect(() => {
    fetchPatients()
    fetchServices()
  }, [])

  async function fetchPatients() {
    const { data } = await supabase.from("patients").select("*")
    setPatients(data || [])
  }

  async function fetchServices() {
    const { data } = await supabase.from("services").select("*")
    setServices(data || [])
  }

  const openVisitDialog = (patient: any) => {
    setSelectedPatient(patient)
    setIsDialogOpen(true)
  }

  async function createVisit(patientId: string) {
    try {
      setLoadingId(patientId)

      const selectedService = services.find(s => s.id === form.service)
      const serviceName = selectedService?.name || "General"

      // 🔥 DETECT DENTAL SERVICE
      const isDental = serviceName.toLowerCase().includes("tooth") ||
        serviceName.toLowerCase().includes("dental") ||
        serviceName.toLowerCase().includes("teeth")

      const clinic = isDental ? "DENTAL" : "GENERAL"

      const { error } = await supabase.from("visits").insert({
        patient_id: patientId,
        visit_type: serviceName,
        clinic: clinic, // ✅ IMPORTANT
        payment_method: form.payment_method,
        payment_status: "paid",
        visit_no: generateVisitNo(),
        status: "TRIAGE",
        triage_status: "pending"
      })

      if (error) throw error

      alert(`Visit created → Sent to TRIAGE (${clinic})`)

      setIsDialogOpen(false)

    } catch (err: any) {
      console.error(err)
      alert("Failed to create visit")
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="p-6">

      <h1 className="text-2xl font-bold mb-4">Patients</h1>

      {patients.map((patient) => (
        <div
          key={patient.id}
          className="border p-4 rounded mb-3 flex justify-between items-center"
        >
          <div>
            {patient.first_name} {patient.last_name}
          </div>

          <button
            onClick={() => openVisitDialog(patient)}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Create Visit
          </button>
        </div>
      ))}

      {isDialogOpen && selectedPatient && (
        <Dialog>
          <div className="p-6 relative">

            <button
              onClick={() => setIsDialogOpen(false)}
              className="absolute top-2 right-2"
            >
              ×
            </button>

            <h2 className="text-xl font-bold mb-4">
              New Visit — {selectedPatient.first_name}
            </h2>

            <select
              value={form.service}
              onChange={(e) =>
                setForm({ ...form, service: e.target.value })
              }
              className="border p-2 rounded mb-4 w-full"
            >
              <option value="">Select Service</option>

              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>

            <select
              value={form.payment_method}
              onChange={(e) =>
                setForm({ ...form, payment_method: e.target.value })
              }
              className="border p-2 rounded mb-4 w-full"
            >
              <option value="">Payment Method</option>
              <option value="Cash">Cash</option>
              <option value="Mobile Money">Mobile Money</option>
              <option value="Insurance">Insurance</option>
              <option value="Card">Card</option>
            </select>

            <button
              onClick={() => createVisit(selectedPatient.id)}
              disabled={loadingId === selectedPatient.id}
              className="bg-green-600 text-white px-4 py-2 rounded w-full"
            >
              {loadingId === selectedPatient.id
                ? "Processing..."
                : "Confirm Visit"}
            </button>

          </div>
        </Dialog>
      )}
    </div>
  )
}