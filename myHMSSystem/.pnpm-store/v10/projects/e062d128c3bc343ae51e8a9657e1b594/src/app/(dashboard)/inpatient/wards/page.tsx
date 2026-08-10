'use client';

import { useState, useEffect } from 'react';
import { getWards, getBeds, getWardStats } from '@/lib/inpatient/api';
import { Ward, Bed, WardStats } from '@/lib/inpatient/types';
import Link from 'next/link';
import { ChevronLeft, AlertCircle, Bed as BedIcon } from 'lucide-react';

export default function WardsPage() {
  const [wards, setWards] = useState<Ward[]>([]);
  const [wardStats, setWardStats] = useState<{ [key: string]: WardStats }>({});
  const [wardBeds, setWardBeds] = useState<{ [key: string]: Bed[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const wardsData = await getWards();
        setWards(wardsData);

        // Load stats and beds for each ward
        const statsMap: { [key: string]: WardStats } = {};
        const bedsMap: { [key: string]: Bed[] } = {};

        for (const ward of wardsData) {
          const [stats, beds] = await Promise.all([
            getWardStats(ward.id),
            getBeds(ward.id),
          ]);
          statsMap[ward.id] = stats;
          bedsMap[ward.id] = beds;
        }

        setWardStats(statsMap);
        setWardBeds(bedsMap);
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
          <p className="text-gray-600">Loading wards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/inpatient"
          className="p-1 hover:bg-gray-200 rounded transition"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ward Management</h1>
          <p className="text-gray-600 mt-1">View and manage wards and bed availability</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-lg border border-red-500 bg-red-500/10 flex gap-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Wards */}
      <div className="space-y-6">
        {wards.map((ward) => {
          const stats = wardStats[ward.id];
          const beds = wardBeds[ward.id] || [];
          const occupancyPercent = stats ? (stats.occupancy_rate).toFixed(1) : '0';

          return (
            <div key={ward.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              {/* Ward Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{ward.name}</h2>
                    <p className="text-gray-600 mt-1">Ward ID: {ward.id}</p>
                  </div>
                  {stats && (
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900">
                        {stats.occupied_beds}/{stats.total_beds}
                      </div>
                      <p className="text-gray-600 text-sm">Occupancy Rate: {occupancyPercent}%</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bed Grid */}
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Beds</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {beds.map((bed) => (
                    <div
                      key={bed.id}
                      className={`p-4 rounded-lg border-2 text-center ${
                        bed.status === 'AVAILABLE'
                          ? 'border-green-300 bg-green-50'
                          : 'border-red-300 bg-red-50'
                      }`}
                    >
                      <BedIcon className={`w-5 h-5 mx-auto mb-2 ${
                        bed.status === 'AVAILABLE' ? 'text-green-600' : 'text-red-600'
                      }`} />
                      <p className="font-semibold text-gray-900 text-sm">{bed.bed_number}</p>
                      <p className={`text-xs font-semibold ${
                        bed.status === 'AVAILABLE'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {bed.status}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ward Stats */}
              {stats && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-gray-600 text-sm">Available</p>
                    <p className="text-2xl font-bold text-green-600">{stats.available_beds}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Occupied</p>
                    <p className="text-2xl font-bold text-red-600">{stats.occupied_beds}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Total Beds</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_beds}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
