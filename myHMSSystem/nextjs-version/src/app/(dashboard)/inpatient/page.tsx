'use client';

import { useEffect, useState } from 'react';
import { getIPDStats, getWards, getActiveAdmissions } from '@/lib/inpatient/api';
import { IPDStats, Ward, Admission } from '@/lib/inpatient/types';
import Link from 'next/link';
import { AlertCircle, Bed, Users, Clock } from 'lucide-react';

export default function IPDDashboard() {
  const [stats, setStats] = useState<IPDStats | null>(null);
  const [wards, setWards] = useState<Ward[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [statsData, wardsData, admissionsData] = await Promise.all([
          getIPDStats(),
          getWards(),
          getActiveAdmissions(),
        ]);
        setStats(statsData);
        setWards(wardsData);
        setAdmissions(admissionsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin mb-4" style={{ width: '40px', height: '40px', border: '4px solid #f3f4f6', borderTop: '4px solid #3b82f6', borderRadius: '50%' }} />
          <p className="text-gray-600">Loading IPD Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="p-4 rounded-lg border border-red-500 bg-red-500/10 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-900">Error Loading Data</h3>
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inpatient Department</h1>
          <p className="text-gray-600 mt-1">Ward & Bed Management</p>
        </div>
        <Link
          href="/dashboard/inpatient/admission"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + New Admission
        </Link>
      </div>

      {/* Statistics Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Total Active Admissions */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Admissions</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_active_admissions}</p>
              </div>
              <Users className="w-10 h-10 text-blue-600/20" />
            </div>
          </div>

          {/* Occupied Beds */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Occupied Beds</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.occupied_beds}</p>
                <p className="text-xs text-gray-500 mt-1">of {stats.total_beds} beds</p>
              </div>
              <Bed className="w-10 h-10 text-orange-600/20" />
            </div>
          </div>

          {/* Available Beds */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Available Beds</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.available_beds}</p>
                <p className="text-xs text-gray-500 mt-1">{(stats.occupancy_rate).toFixed(1)}% occupied</p>
              </div>
              <Bed className="w-10 h-10 text-green-600/20" />
            </div>
          </div>

          {/* Total Wards */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Wards</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_wards}</p>
              </div>
              <Clock className="w-10 h-10 text-purple-600/20" />
            </div>
          </div>
        </div>
      )}

      {/* Wards Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Wards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {wards.map((ward) => {
            const wardAdmissions = admissions.filter((a) => a.wards?.id === ward.id);
            return (
              <Link
                key={ward.id}
                href={`/dashboard/inpatient/wards/${ward.id}`}
                className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer"
              >
                <h3 className="font-semibold text-gray-900">{ward.name}</h3>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Active Patients:</span>
                    <span className="font-semibold text-gray-900">{wardAdmissions.length}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Admissions */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Recent Admissions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Patient ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Ward</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Bed</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Admitted</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {admissions.slice(0, 5).map((admission) => (
                <tr key={admission.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4 text-sm text-gray-900 font-mono">{admission.patient_id.slice(0, 8)}...</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{admission.wards?.name || admission.ward || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{admission.beds?.bed_number || admission.bed_no || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{admission.reason || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(admission.admitted_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      admission.status === 'ADMITTED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {admission.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
