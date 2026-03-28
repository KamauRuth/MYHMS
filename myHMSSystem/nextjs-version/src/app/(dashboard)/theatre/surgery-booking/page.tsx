"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

interface BookingForm {
  patient_id: string
  visit_id: string
  department: string
  procedure_name: string
  urgency: 'elective' | 'emergency'
  preferred_date: string
  preferred_time: string
  surgeon_id: string
  anesthetist_id: string
  estimated_duration: string
  special_requirements: string
}

export default function SurgeryBooking() {
  const [form, setForm] = useState<BookingForm>({
    patient_id: '',
    visit_id: '',
    department: '',
    procedure_name: '',
    urgency: 'elective',
    preferred_date: '',
    preferred_time: '',
    surgeon_id: '',
    anesthetist_id: '',
    estimated_duration: '',
    special_requirements: ''
  })
  const [patients, setPatients] = useState<any[]>([])
  const [visits, setVisits] = useState<any[]>([])
  const [surgeons, setSurgeons] = useState<any[]>([])
  const [anesthetists, setAnesthetists] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    // Load patients (you might want to filter by department)
    const { data: patientsData } = await supabase
      .from("patients")
      .select("*")
      .limit(100)

    if (patientsData) setPatients(patientsData)

    // Load active visits
    const { data: visitsData } = await supabase
      .from("visits")
      .select(`
        *,
        patients (
          first_name,
          last_name
        )
      `)
      .in("status", ["TRIAGE", "IN_PROGRESS", "WAITING_DOCTOR"])
      .order("created_at", { ascending: false })

    if (visitsData) setVisits(visitsData)

    // Load surgeons and anesthetists (assuming staff table exists)
    // For now, using mock data - replace with actual staff query
    setSurgeons([
      { id: '1', name: 'Dr. Smith - General Surgeon' },
      { id: '2', name: 'Dr. Johnson - Orthopedic Surgeon' },
      { id: '3', name: 'Dr. Williams - Neurosurgeon' }
    ])

    setAnesthetists([
      { id: '1', name: 'Dr. Brown - Anesthetist' },
      { id: '2', name: 'Dr. Davis - Anesthetist' }
    ])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Generate booking ID
      const bookingId = `TH-${Date.now()}`

      const bookingData = {
        booking_id: bookingId,
        patient_id: form.patient_id,
        visit_id: form.visit_id,
        department: form.department,
        procedure_name: form.procedure_name,
        urgency: form.urgency,
        preferred_date: form.preferred_date,
        preferred_time: form.preferred_time || null,
        surgeon_id: form.surgeon_id || null,
        anesthetist_id: form.anesthetist_id || null,
        estimated_duration: form.estimated_duration ? `PT${form.estimated_duration}H` : null,
        special_requirements: form.special_requirements || null,
        created_by: 'current_user' // TODO: get from auth
      }

      const { error } = await supabase
        .from("theatre_bookings")
        .insert([bookingData])

      if (error) throw error

      alert(`Surgery booking created successfully! Booking ID: ${bookingId}`)

      // Reset form
      setForm({
        patient_id: '',
        visit_id: '',
        department: '',
        procedure_name: '',
        urgency: 'elective',
        preferred_date: '',
        preferred_time: '',
        surgeon_id: '',
        anesthetist_id: '',
        estimated_duration: '',
        special_requirements: ''
      })

    } catch (error) {
      console.error('Error creating booking:', error)
      alert('Failed to create surgery booking')
    } finally {
      setLoading(false)
    }
  }

  const procedureTypes = [
    'Appendectomy',
    'Cholecystectomy',
    'Hernia Repair',
    'Cesarean Section',
    'Orthopedic Surgery',
    'Neurosurgery',
    'Cardiac Surgery',
    'General Surgery',
    'Gynecological Surgery',
    'Urological Surgery',
    'Other'
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">🔪 Surgery Booking - LIFEPOINT HOSPITAL</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Department</label>
              <select
                value={form.department}
                onChange={(e) => setForm({...form, department: e.target.value})}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="">Select Department</option>
                <option value="OPD">Outpatient Department (OPD)</option>
                <option value="IPD">Inpatient Department (IPD)</option>
                <option value="Maternity">Maternity</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Visit</label>
              <select
                value={form.visit_id}
                onChange={(e) => {
                  const visit = visits.find(v => v.id === e.target.value)
                  setForm({
                    ...form,
                    visit_id: e.target.value,
                    patient_id: visit?.patient_id || ''
                  })
                }}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="">Select Patient Visit</option>
                {visits.map(visit => (
                  <option key={visit.id} value={visit.id}>
                    {visit.patients?.first_name} {visit.patients?.last_name} - {visit.visit_type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Procedure Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Procedure Type</label>
              <select
                value={form.procedure_name}
                onChange={(e) => setForm({...form, procedure_name: e.target.value})}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="">Select Procedure</option>
                {procedureTypes.map(proc => (
                  <option key={proc} value={proc}>{proc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Urgency</label>
              <select
                value={form.urgency}
                onChange={(e) => setForm({...form, urgency: e.target.value as 'elective' | 'emergency'})}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="elective">Elective</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Preferred Date</label>
              <input
                type="date"
                value={form.preferred_date}
                onChange={(e) => setForm({...form, preferred_date: e.target.value})}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Preferred Time</label>
              <input
                type="time"
                value={form.preferred_time}
                onChange={(e) => setForm({...form, preferred_time: e.target.value})}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Estimated Duration (hours)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="12"
                value={form.estimated_duration}
                onChange={(e) => setForm({...form, estimated_duration: e.target.value})}
                className="w-full border rounded px-3 py-2"
                placeholder="2.5"
              />
            </div>
          </div>

          {/* Medical Team */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Surgeon</label>
              <select
                value={form.surgeon_id}
                onChange={(e) => setForm({...form, surgeon_id: e.target.value})}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select Surgeon</option>
                {surgeons.map(surgeon => (
                  <option key={surgeon.id} value={surgeon.id}>{surgeon.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Anesthetist</label>
              <select
                value={form.anesthetist_id}
                onChange={(e) => setForm({...form, anesthetist_id: e.target.value})}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select Anesthetist</option>
                {anesthetists.map(anesthetist => (
                  <option key={anesthetist.id} value={anesthetist.id}>{anesthetist.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Special Requirements */}
          <div>
            <label className="block text-sm font-medium mb-2">Special Requirements</label>
            <textarea
              value={form.special_requirements}
              onChange={(e) => setForm({...form, special_requirements: e.target.value})}
              className="w-full border rounded px-3 py-2 h-24"
              placeholder="Any special equipment, implants, or requirements..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating Booking...' : 'Create Surgery Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}