'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { getAdmissionById, createDischargeSummary } from '@/lib/ipd/api'
import { formatDate } from '@/lib/ipd/utils'
import type { Admission, DischargeSummary } from '@/lib/ipd/types'

export default function CreateDischargePage() {
  const params = useParams()
  const router = useRouter()
  const admissionId = params.id as string

  const [admission, setAdmission] = useState<Admission | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form fields
  const [dischargeDate, setDischargeDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [dischargeType, setDischargeType] = useState<'RECOVERED' | 'IMPROVED' | 'REFERRED' | 'ABSCONDED' | 'EXPIRED' | 'DISCHARGED_AGAINST_ADVICE'>('RECOVERED')
  const [dischargeCdition, setDischargeCondition] = useState<'GOOD' | 'FAIR' | 'POOR'>('GOOD')
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState('')
  const [secondaryDiagnoses, setSecondaryDiagnoses] = useState('')
  const [proceduresPerformed, setProceduresPerformed] = useState('')
  const [investigationsDone, setInvestigationsDone] = useState('')
  const [investigationResults, setInvestigationResults] = useState('')
  const [clinicalSummary, setClinicalSummary] = useState('')
  const [dischargeMedication, setDischargeMedication] = useState('')
  const [followUpInstructions, setFollowUpInstructions] = useState('')
  const [followUpDate, setFollowUpDate] = useState<string>('')
  const [followUpDepartment, setFollowUpDepartment] = useState('')
  const [adviceGiven, setAdviceGiven] = useState('')
  const [patientEducation, setPatientEducation] = useState('')
  const [referralDetails, setReferralDetails] = useState('')
  const [destination, setDestination] = useState('')

  useEffect(() => {
    const fetchAdmission = async () => {
      try {
        setLoading(true)
        const data = await getAdmissionById(admissionId)
        if (!data) {
          setError('Admission not found')
          return
        }
        setAdmission(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load admission')
        console.error('Error loading admission:', err)
      } finally {
        setLoading(false)
      }
    }

    if (admissionId) {
      fetchAdmission()
    }
  }, [admissionId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!primaryDiagnosis.trim()) {
      alert('Primary diagnosis is required')
      return
    }

    if (!clinicalSummary.trim()) {
      alert('Clinical summary is required')
      return
    }

    try {
      setSubmitting(true)
      
      const input = {
        admission_id: admissionId,
        discharge_date: new Date(dischargeDate).toISOString(),
        discharge_type: dischargeType,
        discharge_condition: dischargeCdition,
        primary_diagnosis: primaryDiagnosis,
        secondary_diagnoses: secondaryDiagnoses || null,
        procedures_performed: proceduresPerformed || null,
        investigations_done: investigationsDone || null,
        investigation_results: investigationResults || null,
        clinical_summary: clinicalSummary,
        discharge_medication: dischargeMedication || null,
        follow_up_instructions: followUpInstructions || null,
        follow_up_date: followUpDate ? new Date(followUpDate).toISOString().split('T')[0] : null,
        follow_up_department: followUpDepartment || null,
        advice_given: adviceGiven || null,
        patient_education: patientEducation || null,
        referral_details: referralDetails || null,
        destination: destination || null,
      }

      await createDischargeSummary(input)
      alert('Discharge summary created successfully')
      router.push(`/ipd/admission/${admissionId}`)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create discharge summary'
      alert(errorMsg)
      console.error('Error creating discharge summary:', err)
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
        <div className="max-w-4xl mx-auto">
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/ipd/admission/${admissionId}`} className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4">
            <ArrowLeft className="h-5 w-5" />
            Back to Admission
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create Discharge Summary</h1>
          <p className="text-gray-600 mt-2">Admission ID: {admission.id}</p>
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
          
          {/* Discharge Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Discharge Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discharge Date</label>
                <input
                  type="date"
                  value={dischargeDate}
                  onChange={(e) => setDischargeDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discharge Type</label>
                <select
                  value={dischargeType}
                  onChange={(e) => setDischargeType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="RECOVERED">Recovered</option>
                  <option value="IMPROVED">Improved</option>
                  <option value="REFERRED">Referred</option>
                  <option value="ABSCONDED">Absconded</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="DISCHARGED_AGAINST_ADVICE">Discharged Against Advice</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discharge Condition</label>
                <select
                  value={dischargeCdition}
                  onChange={(e) => setDischargeCondition(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                  <option value="POOR">Poor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                <input
                  type="text"
                  placeholder="e.g., Home, Other hospital"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Clinical Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Clinical Information</h2>
            <div className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Diagnosis *</label>
                <textarea
                  placeholder="Enter primary diagnosis"
                  value={primaryDiagnosis}
                  onChange={(e) => setPrimaryDiagnosis(e.target.value)}
                  required
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Diagnoses</label>
                <textarea
                  placeholder="Enter secondary diagnoses (comma-separated or one per line)"
                  value={secondaryDiagnoses}
                  onChange={(e) => setSecondaryDiagnoses(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Procedures Performed</label>
                <textarea
                  placeholder="Enter procedures performed during admission"
                  value={proceduresPerformed}
                  onChange={(e) => setProceduresPerformed(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Summary *</label>
                <textarea
                  placeholder="Enter clinical summary of the admission and treatment"
                  value={clinicalSummary}
                  onChange={(e) => setClinicalSummary(e.target.value)}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Investigations */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Investigations</h2>
            <div className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Investigations Done</label>
                <textarea
                  placeholder="List investigations performed"
                  value={investigationsDone}
                  onChange={(e) => setInvestigationsDone(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Investigation Results</label>
                <textarea
                  placeholder="Enter investigation results"
                  value={investigationResults}
                  onChange={(e) => setInvestigationResults(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Post-Discharge Instructions */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Post-Discharge Instructions</h2>
            <div className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discharge Medication</label>
                <textarea
                  placeholder="List medications to continue at home"
                  value={dischargeMedication}
                  onChange={(e) => setDischargeMedication(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Instructions</label>
                <textarea
                  placeholder="Enter follow-up instructions for the patient"
                  value={followUpInstructions}
                  onChange={(e) => setFollowUpInstructions(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Department</label>
                  <input
                    type="text"
                    placeholder="e.g., OPD, Clinic"
                    value={followUpDepartment}
                    onChange={(e) => setFollowUpDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Advice Given</label>
                  <textarea
                    placeholder="General advice"
                    value={adviceGiven}
                    onChange={(e) => setAdviceGiven(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient Education</label>
                <textarea
                  placeholder="Education provided to patient"
                  value={patientEducation}
                  onChange={(e) => setPatientEducation(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referral Details</label>
                <textarea
                  placeholder="If referred to another facility/specialist"
                  value={referralDetails}
                  onChange={(e) => setReferralDetails(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 px-6 rounded-lg flex items-center gap-2 transition"
            >
              <Save className="h-5 w-5" />
              {submitting ? 'Saving...' : 'Save Discharge Summary'}
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
