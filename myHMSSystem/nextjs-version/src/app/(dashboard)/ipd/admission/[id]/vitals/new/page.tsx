'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { getAdmissionById, createVital } from '@/lib/ipd/api'
import { formatDateTime } from '@/lib/ipd/utils'
import type { Admission } from '@/lib/ipd/types'

export default function RecordVitalsPage() {
  const params = useParams()
  const router = useRouter()
  const admissionId = params.id as string

  const [admission, setAdmission] = useState<Admission | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form fields
  const [temperature, setTemperature] = useState('')
  const [bpSystolic, setBpSystolic] = useState('')
  const [bpDiastolic, setBpDiastolic] = useState('')
  const [pulse, setPulse] = useState('')
  const [spo2, setSpo2] = useState('')
  const [respiratoryRate, setRespiratoryRate] = useState('')
  const [notes, setNotes] = useState('')

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

    if (!temperature || !pulse || !bpSystolic || !bpDiastolic || !spo2) {
      alert('All vital signs are required')
      return
    }

    try {
      setSubmitting(true)
      
      await createVital({
        admission_id: admissionId,
        temperature: parseFloat(temperature),
        bp_systolic: parseInt(bpSystolic),
        bp_diastolic: parseInt(bpDiastolic),
        pulse: parseInt(pulse),
        spo2: parseFloat(spo2),
        respiratory_rate: respiratoryRate ? parseInt(respiratoryRate) : null,
        notes: notes || null,
      })

      alert('Vitals recorded successfully')
      router.push(`/ipd/admission/${admissionId}`)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to record vitals'
      alert(errorMsg)
      console.error('Error recording vitals:', err)
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
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/ipd/admission/${admissionId}`} className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4">
            <ArrowLeft className="h-5 w-5" />
            Back to Admission
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Record Vital Signs</h1>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°C) *</label>
              <input
                type="number"
                step="0.1"
                min="35"
                max="42"
                placeholder="e.g., 37.5"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pulse (bpm) *</label>
              <input
                type="number"
                min="40"
                max="200"
                placeholder="e.g., 72"
                value={pulse}
                onChange={(e) => setPulse(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BP Systolic (mmHg) *</label>
              <input
                type="number"
                min="60"
                max="250"
                placeholder="e.g., 120"
                value={bpSystolic}
                onChange={(e) => setBpSystolic(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BP Diastolic (mmHg) *</label>
              <input
                type="number"
                min="40"
                max="150"
                placeholder="e.g., 80"
                value={bpDiastolic}
                onChange={(e) => setBpDiastolic(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SpO₂ (%) *</label>
              <input
                type="number"
                step="0.1"
                min="70"
                max="100"
                placeholder="e.g., 98"
                value={spo2}
                onChange={(e) => setSpo2(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Respiratory Rate (breaths/min)</label>
              <input
                type="number"
                min="8"
                max="60"
                placeholder="e.g., 16"
                value={respiratoryRate}
                onChange={(e) => setRespiratoryRate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              placeholder="Any observations or notes about the patient"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 px-6 rounded-lg flex items-center gap-2 transition"
            >
              <Save className="h-5 w-5" />
              {submitting ? 'Saving...' : 'Save Vitals'}
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
