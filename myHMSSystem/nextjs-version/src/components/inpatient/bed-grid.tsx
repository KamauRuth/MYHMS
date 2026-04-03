'use client';

import { Bed } from '@/lib/inpatient/types';
import { Bed as BedIcon } from 'lucide-react';

interface BedGridProps {
  beds: Bed[];
  onBedClick?: (bed: Bed) => void;
  selectable?: boolean;
  selectedBedId?: string;
}

export function BedGrid({ beds, onBedClick, selectable = false, selectedBedId }: BedGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {beds.map((bed) => (
        <button
          key={bed.id}
          onClick={() => onBedClick?.(bed)}
          disabled={bed.status === 'OCCUPIED' && selectable}
          className={`p-4 rounded-lg border-2 text-center transition ${
            selectedBedId === bed.id
              ? 'border-blue-500 bg-blue-50'
              : bed.status === 'AVAILABLE'
              ? 'border-green-300 bg-green-50 hover:border-green-400 cursor-pointer'
              : 'border-red-300 bg-red-50 opacity-60 cursor-not-allowed'
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
        </button>
      ))}
    </div>
  );
}
