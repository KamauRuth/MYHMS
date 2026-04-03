'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Plus, FileText, Activity, Pill, Calendar } from 'lucide-react'
import Link from 'next/link'
import {
  getAdmissionById,
  getDailyNotes,
  getVitals,
  getMedications,
  getProcedures,
  getDischargeSummary,
} from '@/lib/ipd/api'
import {
  formatDate,
  formatDateTime,
  getDaysInAdmission,
  getPriorityColor,
  getStatusColor,
  getNoteTypeColor,
  getProcedureStatusColor,
} from '@/lib/ipd/utils'
import type {
  Admission,
  DailyNote,
  Vital,
  Medication,
  Procedure,
  DischargeSummary,
} from '@/lib/ipd/types'

export default function AdmissionDetailPage() {
  const params = useParams()
  const admissionId = params.id as string

  const [admission, setAdmission] = useState<Admission | null>(null)
  const [dailyNotes, setDailyNotes] = useState<DailyNote[]>([])
  const [vitals, setVitals] = useState<Vital[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [dischargeSummary, setDischargeSummary] = useState<DischargeSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'notes' | 'vitals' | 'meds' | 'procedures' | 'discharge'>(
    'notes'
  )

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [admissionData, notesData, vitalsData, medsData, procsData, dischargeSummaryData] =
          await Promise.all([
            getAdmissionById(admissionId),
            getDailyNotes(admissionId),
            getVitals(admissionId),
            getMedications(admissionId),
            getProcedures(admissionId),
            getDischargeSummary(admissionId),
          ])

        setAdmission(admissionData)
        setDailyNotes(notesData)
        setVitals(vitalsData)
        setMedications(medsData)
        setProcedures(procsData)
        setDischargeSummary(dischargeSummaryData)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load admission details')
        console.error('Error loading admission details:', err)
      } finally {
        setLoading(false)
      }
    }

    if (admissionId) {
      fetchData()
    }
  }, [admissionId])

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
        <div className="max-w-7xl mx-auto">
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

  const latestVital = vitals[0] || null

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Link href="/ipd" className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4">
          <ArrowLeft className="h-5 w-5" />
          Back to IPD
        </Link>

        {/* Admission Info Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Admission ID</p>
              <p className="text-lg font-semibold text-gray-900">{admission.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ward</p>
              <p className="text-lg font-semibold text-gray-900">{admission.ward}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Admitted</p>
              <p className="text-lg font-semibold text-gray-900">{formatDate(admission.admitted_at)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Days Admitted</p>
              <p className="text-lg font-semibold text-gray-900">
                {getDaysInAdmission(admission.admitted_at, admission.discharged_at)} days
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Reason for Admission</p>
            <p className="text-gray-900">{admission.reason}</p>
          </div>
        </div>

        {/* Latest Vitals */}
        {latestVital && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Latest Vitals
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {latestVital.temperature && (
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-xs text-gray-600">Temperature</p>
                  <p className="text-lg font-semibold text-gray-900">{latestVital.temperature}°C</p>
                </div>
              )}
              {latestVital.pulse && (
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-xs text-gray-600">Pulse</p>
                  <p className="text-lg font-semibold text-gray-900">{latestVital.pulse} bpm</p>
                </div>
              )}
              {latestVital.bp_systolic && latestVital.bp_diastolic && (
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-xs text-gray-600">Blood Pressure</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {latestVital.bp_systolic}/{latestVital.bp_diastolic}
                  </p>
                </div>
              )}
              {latestVital.spo2 && (
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-xs text-gray-600">SpO₂</p>
                  <p className="text-lg font-semibold text-gray-900">{latestVital.spo2}%</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-2">
          {[
            { id: 'notes' as const, label: 'Daily Notes', icon: FileText },
            { id: 'vitals' as const, label: 'Vitals', icon: Activity },
            { id: 'meds' as const, label: 'Medications', icon: Pill },
            { id: 'procedures' as const, label: 'Procedures', icon: Calendar },
            { id: 'discharge' as const, label: 'Discharge', icon: ArrowLeft },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded transition ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Daily Notes Tab */}
          {activeTab === 'notes' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Daily Notes</h3>
                <Link
                  href={`/ipd/admission/${admissionId}/notes/new`}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Add Note
                </Link>
              </div>
              {dailyNotes.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No notes yet</p>
              ) : (
                <div className="space-y-4">
                  {dailyNotes.map((note) => (
                    <div key={note.id} className="border border-gray-200 rounded p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          {note.title && (
                            <p className="font-semibold text-gray-900">{note.title}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${getNoteTypeColor(note.note_type)}`}
                            >
                              {note.note_type}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(note.priority)}`}>
                              {note.priority}
                            </span>
                            {note.is_critical && (
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800">
                                CRITICAL
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">{formatDateTime(note.created_at)}</p>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{note.notes}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Vitals Tab */}
          {activeTab === 'vitals' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Vital Signs</h3>
                <Link
                  href={`/ipd/admission/${admissionId}/vitals/new`}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Record Vitals
                </Link>
              </div>
              {vitals.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No vitals recorded yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Date/Time</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Temp</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">BP</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Pulse</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">SpO₂</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vitals.map((vital) => (
                        <tr key={vital.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3">{formatDateTime(vital.created_at)}</td>
                          <td className="px-4 py-3">{vital.temperature ? `${vital.temperature}°C` : '-'}</td>
                          <td className="px-4 py-3">
                            {vital.bp_systolic && vital.bp_diastolic
                              ? `${vital.bp_systolic}/${vital.bp_diastolic}`
                              : '-'}
                          </td>
                          <td className="px-4 py-3">{vital.pulse ? `${vital.pulse} bpm` : '-'}</td>
                          <td className="px-4 py-3">{vital.spo2 ? `${vital.spo2}%` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Medications Tab */}
          {activeTab === 'meds' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Medications</h3>
                <Link
                  href={`/ipd/admission/${admissionId}/medications/new`}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Add Medication
                </Link>
              </div>
              {medications.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No medications prescribed</p>
              ) : (
                <div className="space-y-4">
                  {medications.map((med) => (
                    <div key={med.id} className="border border-gray-200 rounded p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{med.drug_name}</p>
                          <p className="text-sm text-gray-600">{med.dosage} | {med.frequency}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(med.status)}`}>
                          {med.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">Indication: {med.indication}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Procedures Tab */}
          {activeTab === 'procedures' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Procedures</h3>
                <Link
                  href={`/ipd/admission/${admissionId}/procedures/new`}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Add Procedure
                </Link>
              </div>
              {procedures.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No procedures scheduled</p>
              ) : (
                <div className="space-y-4">
                  {procedures.map((proc) => (
                    <div key={proc.id} className="border border-gray-200 rounded p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{proc.procedure_name}</p>
                          <p className="text-sm text-gray-600">{formatDate(proc.scheduled_date)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getProcedureStatusColor(proc.status)}`}>
                            {proc.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">Indication: {proc.indication}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Discharge Tab */}
          {activeTab === 'discharge' && (
            <div className="p-6">
              {dischargeSummary ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Discharge Summary</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Discharge Date</p>
                      <p className="font-semibold text-gray-900">{formatDateTime(dischargeSummary.discharge_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Primary Diagnosis</p>
                      <p className="font-semibold text-gray-900">{dischargeSummary.primary_diagnosis}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Clinical Summary</p>
                      <p className="text-gray-900 whitespace-pre-wrap">{dischargeSummary.clinical_summary}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No discharge summary yet</p>
                  <Link
                    href={`/ipd/admission/${admissionId}/discharge/new`}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Create Discharge Summary
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
