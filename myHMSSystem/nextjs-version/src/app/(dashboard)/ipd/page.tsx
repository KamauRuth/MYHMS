'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, Activity, FileText, Calendar, TrendingUp } from 'lucide-react'
import { getActiveAdmissions, getIPDStats } from '@/lib/ipd/api'
import { formatDate, getDaysInAdmission, getPriorityColor, getStatusColor } from '@/lib/ipd/utils'
import type { AdmissionWithPatient, IPDStats } from '@/lib/ipd/types'

export default function IPDDashboard() {
  const [admissions, setAdmissions] = useState<AdmissionWithPatient[]>([])
  const [stats, setStats] = useState<IPDStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [admissionsData, statsData] = await Promise.all([
          getActiveAdmissions(),
          getIPDStats(),
        ])
        setAdmissions(admissionsData)
        setStats(statsData)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load IPD data')
        console.error('Error loading IPD dashboard:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Inpatient Department (IPD)</h1>
          <p className="text-gray-600 mt-2">Manage patient admissions, medications, procedures, and discharge</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Active Admissions */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Active Admissions</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_active_admissions}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Discharges Today */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Discharges Today</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_discharges_today}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Critical Notes */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Critical Notes</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.critical_notes_count}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>

            {/* Urgent Procedures */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Urgent Procedures</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.urgent_procedures_count}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Calendar className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/ipd/admissions"
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg flex items-center gap-3 transition"
          >
            <Activity className="h-5 w-5" />
            <span>Manage Admissions</span>
          </Link>
          <Link
            href="/ipd/medications"
            className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg flex items-center gap-3 transition"
          >
            <FileText className="h-5 w-5" />
            <span>Medications & MAR</span>
          </Link>
          <Link
            href="/ipd/procedures"
            className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg flex items-center gap-3 transition"
          >
            <Calendar className="h-5 w-5" />
            <span>Manage Procedures</span>
          </Link>
        </div>

        {/* Active Admissions Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Active Admissions</h2>
            <span className="text-sm text-gray-600">{admissions.length} patient(s)</span>
          </div>

          {admissions.length === 0 ? (
            <div className="p-8 text-center">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No active admissions</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Ward</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Admission Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Days</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {admissions.map((admission) => (
                    <tr key={admission.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {admission.patient?.first_name} {admission.patient?.last_name}
                          </p>
                          <p className="text-xs text-gray-500">{admission.patient_id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{admission.ward}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{formatDate(admission.admitted_at)}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {getDaysInAdmission(admission.admitted_at)}d
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{admission.reason}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(admission.status)}`}>
                          {admission.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/ipd/admission/${admission.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
