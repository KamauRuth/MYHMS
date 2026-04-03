'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Filter } from 'lucide-react'
import { getActiveAdmissions } from '@/lib/ipd/api'
import { formatDate, getDaysInAdmission, getStatusColor } from '@/lib/ipd/utils'
import type { AdmissionWithPatient } from '@/lib/ipd/types'

export default function AdmissionsPage() {
  const [admissions, setAdmissions] = useState<AdmissionWithPatient[]>([])
  const [filteredAdmissions, setFilteredAdmissions] = useState<AdmissionWithPatient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ADMITTED' | 'DISCHARGED'>('ADMITTED')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const data = await getActiveAdmissions()
        setAdmissions(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load admissions')
        console.error('Error loading admissions:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    let filtered = admissions

    if (filterStatus !== 'ALL') {
      filtered = filtered.filter((adm) => adm.status === filterStatus)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (adm) =>
          adm.patient?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          adm.patient?.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          adm.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          adm.ward.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredAdmissions(filtered)
  }, [admissions, searchTerm, filterStatus])

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
        <Link href="/ipd" className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4">
          <ArrowLeft className="h-5 w-5" />
          Back to Dashboard
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">All Admissions</h1>
          <p className="text-gray-600 mt-2">View and manage patient admissions</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by patient name, ID, or ward..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Statuses</option>
                <option value="ADMITTED">Active Admissions</option>
                <option value="DISCHARGED">Discharged</option>
              </select>
            </div>
          </div>
        </div>

        {/* Admissions Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {filteredAdmissions.length} admission(s)
            </h2>
            <span className="text-sm text-gray-600">
              {filterStatus === 'ALL'
                ? 'All'
                : filterStatus === 'ADMITTED'
                  ? 'Active'
                  : 'Discharged'}
            </span>
          </div>

          {filteredAdmissions.length === 0 ? (
            <div className="p-8 text-center">
              <Filter className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">
                {searchTerm ? 'No admissions match your search' : 'No admissions found'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Patient ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Ward</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Admitted</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Days/Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdmissions.map((admission) => (
                    <tr
                      key={admission.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {admission.patient?.first_name} {admission.patient?.last_name}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{admission.patient_id}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{admission.ward}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{formatDate(admission.admitted_at)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-900">
                            {getDaysInAdmission(
                              admission.admitted_at,
                              admission.discharged_at
                            )}
                            d
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(admission.status)}`}
                          >
                            {admission.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 truncate">{admission.reason}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/ipd/admission/${admission.id}`}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            Details
                          </Link>
                          {admission.status === 'ADMITTED' && (
                            <Link
                              href={`/ipd/admission/${admission.id}/vitals/new`}
                              className="text-green-600 hover:text-green-800 font-medium text-sm"
                            >
                              Vitals
                            </Link>
                          )}
                        </div>
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
