'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { getAdmissionByIdWithPatient, createProcedure, getStaffByRole, createTheatreBooking } from '@/lib/ipd/api'
import type { AdmissionWithPatient } from '@/lib/ipd/types'

interface Staff {
  id: string
  first_name: string
  last_name: string
  specialty: string | null
}

export default function ScheduleProcedurePage() {
  const params = useParams()
  const router = useRouter()
  const admissionId = params.id as string

  const [admission, setAdmission] = useState<AdmissionWithPatient | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [surgeons, setSurgeons] = useState<Staff[]>([])
  const [anesthetists, setAnesthetists] = useState<Staff[]>([])
  const [loadingStaff, setLoadingStaff] = useState(false)

  // Form fields
  const [procedureName, setProcedureName] = useState('')
  const [procedureType, setProcedureType] = useState<'SURGERY' | 'MINOR_PROCEDURE' | 'DIAGNOSTIC' | 'THERAPEUTIC'>('DIAGNOSTIC')
  const [urgency, setUrgency] = useState<'EMERGENCY' | 'URGENT' | 'ELECTIVE'>('ELECTIVE')
  const [indication, setIndication] = useState('')
  const [scheduledDate, setScheduledDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [scheduledTime, setScheduledTime] = useState('')
  const [location, setLocation] = useState('')
  const [procedureCode, setProcedureCode] = useState('')
  const [preOperativeNotes, setPreOperativeNotes] = useState('')
  const [surgeonId, setSurgeonId] = useState('')
  const [anesthetistId, setAnesthetistId] = useState('')
  const [estimatedDuration, setEstimatedDuration] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [admissionData, surgeonsData, anesthetistsData] = await Promise.all([
          getAdmissionByIdWithPatient(admissionId),
          getStaffByRole('surgeon'),
          getStaffByRole('anesthetist'),
        ])
        
        if (!admissionData) {
          setError('Admission not found')
          return
        }
        setAdmission(admissionData)
        setSurgeons(surgeonsData)
        setAnesthetists(anesthetistsData)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
        console.error('Error loading data:', err)
      } finally {
        setLoading(false)
      }
    }

    if (admissionId) {
      fetchData()
    }
  }, [admissionId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!procedureName.trim() || !indication.trim()) {
      alert('Procedure name and indication are required')
      return
    }

    if (procedureType === 'SURGERY' && !scheduledDate) {
      alert('Scheduled date is required for surgery procedures')
      return
    }

    try {
      setSubmitting(true)
      
      // Create the procedure
      const procedure = await createProcedure({
        admission_id: admissionId,
        procedure_name: procedureName,
        procedure_code: procedureCode || null,
        procedure_type: procedureType,
        urgency: urgency,
        indication: indication,
        scheduled_date: new Date(scheduledDate).toISOString().split('T')[0],
        scheduled_time: scheduledTime || null,
        location: location || null,
        pre_operative_notes: preOperativeNotes || null,
      })

      // If it's a surgery, also create a theatre booking
      if (procedureType === 'SURGERY' && admission?.patient_id && admission?.visit_id) {
        try {
          await createTheatreBooking({
            patient_id: admission.patient_id,
            visit_id: admission.visit_id,
            procedure_name: procedureName,
            procedure_type: procedureType,
            urgency: urgency,
            preferred_date: new Date(scheduledDate).toISOString().split('T')[0],
            preferred_time: scheduledTime || null,
            surgeon_id: surgeonId || null,
            anesthetist_id: anesthetistId || null,
            estimated_duration: estimatedDuration || null,
            special_requirements: preOperativeNotes || null,
          })
        } catch (theatreErr) {
          console.warn('Failed to create theatre booking:', theatreErr)
          // Don't fail the entire operation if theatre booking fails
        }
      }

      alert('Procedure scheduled successfully' + (procedureType === 'SURGERY' ? ' and theatre booking created' : ''))
      router.push(`/ipd/admission/${admissionId}`)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to schedule procedure'
      alert(errorMsg)
      console.error('Error scheduling procedure:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!admission) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Link href="/ipd" className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4">
            <ArrowLeft className="h-5 w-5" />
            Back to IPD
          </Link>
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-600">Admission not found</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/ipd/admission/${admissionId}`} className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4">
            <ArrowLeft className="h-5 w-5" />
            Back to Admission
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Schedule Procedure</h1>
          {admission?.patient && (
            <p className="text-gray-600 mt-2">
              Patient: <span className="font-semibold text-gray-900">{admission.patient.first_name} {admission.patient.last_name}</span>
            </p>
          )}
          <p className="text-gray-600">Admission ID: {admission?.id}</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          
          {/* Procedure Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Procedure Information</h2>
            <div className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Procedure Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Appendectomy, Cesarean Section"
                  value={procedureName}
                  onChange={(e) => setProcedureName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Procedure Type *</label>
                  <select
                    value={procedureType}
                    onChange={(e) => setProcedureType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="SURGERY">Surgery</option>
                    <option value="MINOR_PROCEDURE">Minor Procedure</option>
                    <option value="DIAGNOSTIC">Diagnostic</option>
                    <option value="THERAPEUTIC">Therapeutic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Urgency *</label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ELECTIVE">Elective</option>
                    <option value="URGENT">Urgent</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Procedure Code (ICD)</label>
                  <input
                    type="text"
                    placeholder="e.g., ICD code"
                    value={procedureCode}
                    onChange={(e) => setProcedureCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Indication *</label>
                <textarea
                  placeholder="Why is this procedure needed?"
                  value={indication}
                  onChange={(e) => setIndication(e.target.value)}
                  required
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Scheduling */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Scheduling</h2>
            <div className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date *</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Time</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g., Theatre 1, OR 2"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pre-operative Notes</label>
                <textarea
                  placeholder="Any pre-operative preparations or notes"
                  value={preOperativeNotes}
                  onChange={(e) => setPreOperativeNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Theatre Information - Show for Surgery procedures */}
          {procedureType === 'SURGERY' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Theatre Information</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-700">This surgery will be booked in the theatre system with the information provided below.</p>
              </div>
              <div className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Surgeon</label>
                    <select
                      value={surgeonId}
                      onChange={(e) => setSurgeonId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">-- Select a surgeon --</option>
                      {surgeons.map((surgeon) => (
                        <option key={surgeon.id} value={surgeon.id}>
                          Dr. {surgeon.first_name} {surgeon.last_name}
                          {surgeon.specialty ? ` (${surgeon.specialty})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Anesthetist</label>
                    <select
                      value={anesthetistId}
                      onChange={(e) => setAnesthetistId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">-- Select an anesthetist --</option>
                      {anesthetists.map((anesthetist) => (
                        <option key={anesthetist.id} value={anesthetist.id}>
                          Dr. {anesthetist.first_name} {anesthetist.last_name}
                          {anesthetist.specialty ? ` (${anesthetist.specialty})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Duration (minutes)</label>
                  <input
                    type="number"
                    placeholder="e.g., 60, 120"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value)}
                    min="0"
                    max="480"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 px-6 rounded-lg flex items-center gap-2 transition"
            >
              <Save className="h-5 w-5" />
              {submitting ? 'Saving...' : 'Schedule Procedure'}
            </button>
            
            <Link
              href={`/ipd/admission/${admissionId}`}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg transition"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
