'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getActiveAdmissions } from '@/lib/ipd/api'
import type { AdmissionWithPatient } from '@/lib/ipd/types'

export default function ProceduresPage() {
  const [admissions, setAdmissions] = useState<AdmissionWithPatient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getActiveAdmissions()
        setAdmissions(data)
      } catch (err) {
        console.error('Error loading admissions:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <Link href="/ipd" className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4">
          <ArrowLeft className="h-5 w-5" />
          Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Procedures Management</h1>
        <p className="text-gray-600 mb-6">Schedule and manage surgical and medical procedures</p>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule Procedure</h2>
          {admissions.length === 0 ? (
            <p className="text-gray-500">No active admissions</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {admissions.map((admission) => (
                <Link
                  key={admission.id}
                  href={`/ipd/admission/${admission.id}/procedures/new`}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition"
                >
                  <p className="font-semibold text-gray-900">
                    {admission.patient?.first_name} {admission.patient?.last_name}
                  </p>
                  <p className="text-sm text-gray-600">Ward: {admission.ward}</p>
                  <p className="text-sm text-gray-600 mt-2">→ Schedule Procedure</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
