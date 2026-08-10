'use client';

import { IPDStats } from '@/lib/inpatient/types';
import { Users, Bed, TrendingUp, BarChart3 } from 'lucide-react';

interface StatsCardProps {
  stats: IPDStats;
}

export function StatsCard({ stats }: StatsCardProps) {
  const occupancyPercent = stats.total_beds > 0 
    ? ((stats.occupied_beds / stats.total_beds) * 100).toFixed(1) 
    : '0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <p className="text-xs text-gray-500 mt-1">{occupancyPercent}% occupied</p>
          </div>
          <TrendingUp className="w-10 h-10 text-green-600/20" />
        </div>
      </div>

      {/* Total Wards */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Total Wards</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_wards}</p>
          </div>
          <BarChart3 className="w-10 h-10 text-purple-600/20" />
        </div>
      </div>
    </div>
  );
}
