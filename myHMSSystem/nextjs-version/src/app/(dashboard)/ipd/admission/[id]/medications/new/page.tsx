'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { getAdmissionById, createMedication } from '@/lib/ipd/api'
import type { Admission } from '@/lib/ipd/types'

export default function PrescribeMedicationPage() {
  const params = useParams()
  const router = useRouter()
  const admissionId = params.id as string

  const [admission, setAdmission] = useState<Admission | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form fields
  const [drugName, setDrugName] = useState('')
  const [dosage, setDosage] = useState('')
  const [frequency, setFrequency] = useState('OD')
  const [route, setRoute] = useState<'ORAL' | 'INTRAVENOUS' | 'INTRAMUSCULAR' | 'SUBCUTANEOUS' | 'TOPICAL' | 'INHALED' | 'RECTAL' | 'SUBLINGUAL'>('ORAL')
  const [indication, setIndication] = useState('')
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState<string>('')
  const [durationDays, setDurationDays] = useState('')
  const [isPrn, setIsPrn] = useState(false)
  const [specialInstructions, setSpecialInstructions] = useState('')

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

    if (!drugName.trim() || !dosage.trim() || !indication.trim()) {
      alert('Drug name, dosage, and indication are required')
      return
    }

    try {
      setSubmitting(true)
      
      await createMedication({
        admission_id: admissionId,
        drug_name: drugName,
        dosage: dosage,
        frequency: frequency,
        route: route,
        indication: indication,
        start_date: new Date(startDate).toISOString().split('T')[0],
        end_date: endDate ? new Date(endDate).toISOString().split('T')[0] : null,
        duration_days: durationDays ? parseInt(durationDays) : null,
        is_prn: isPrn,
        special_instructions: specialInstructions || null,
      })

      alert('Medication prescribed successfully')
      router.push(`/ipd/admission/${admissionId}`)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to prescribe medication'
      alert(errorMsg)
      console.error('Error prescribing medication:', err)
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
          <h1 className="text-3xl font-bold text-gray-900">Prescribe Medication</h1>
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
          
          {/* Drug Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Drug Information</h2>
            <div className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Drug Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Paracetamol, Ibuprofen"
                  value={drugName}
                  onChange={(e) => setDrugName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dosage *</label>
                  <input
                    type="text"
                    placeholder="e.g., 500mg, 2 tablets"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency *</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="OD">Once Daily (OD)</option>
                    <option value="BD">Twice Daily (BD)</option>
                    <option value="TDS">Three Times Daily (TDS)</option>
                    <option value="QID">Four Times Daily (QID)</option>
                    <option value="Q4H">Every 4 Hours</option>
                    <option value="Q6H">Every 6 Hours</option>
                    <option value="Q8H">Every 8 Hours</option>
                    <option value="Q12H">Every 12 Hours</option>
                    <option value="STAT">Immediately (STAT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Route *</label>
                  <select
                    value={route}
                    onChange={(e) => setRoute(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ORAL">Oral (PO)</option>
                    <option value="INTRAVENOUS">Intravenous (IV)</option>
                    <option value="INTRAMUSCULAR">Intramuscular (IM)</option>
                    <option value="SUBCUTANEOUS">Subcutaneous (SC)</option>
                    <option value="TOPICAL">Topical</option>
                    <option value="INHALED">Inhaled</option>
                    <option value="RECTAL">Rectal</option>
                    <option value="SUBLINGUAL">Sublingual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Indication *</label>
                <textarea
                  placeholder="Why is this medication being prescribed?"
                  value={indication}
                  onChange={(e) => setIndication(e.target.value)}
                  required
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Dosage Schedule */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dosage Schedule</h2>
            <div className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    placeholder="e.g., 7, 14"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="prn-checkbox"
                    checked={isPrn}
                    onChange={(e) => setIsPrn(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="prn-checkbox" className="ml-2 block text-sm text-gray-700">
                    As needed (PRN)
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                <textarea
                  placeholder="e.g., Take with food, Avoid dairy products"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
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
              {submitting ? 'Saving...' : 'Prescribe Medication'}
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
