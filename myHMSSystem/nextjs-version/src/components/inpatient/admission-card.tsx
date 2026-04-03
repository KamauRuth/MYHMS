'use client';

import { Admission } from '@/lib/inpatient/types';
import { formatDate, getDaysInAdmission, truncateText } from '@/lib/inpatient/utils';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface AdmissionCardProps {
  admission: Admission;
  onClick?: () => void;
}

export function AdmissionCard({ admission, onClick }: AdmissionCardProps) {
  const daysInAdmission = getDaysInAdmission(admission.admitted_at);

  return (
    <Link
      href={`/dashboard/inpatient/patients/${admission.id}`}
      className="block"
    >
      <div
        className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer"
        onClick={onClick}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-xs text-gray-500 font-mono">
              {admission.patient_id.slice(0, 8)}
            </p>
            <p className="font-semibold text-gray-900 mt-1">
              {admission.beds?.bed_number || admission.bed_no || 'No Bed'} •{' '}
              {admission.wards?.name || admission.ward || 'Unknown Ward'}
            </p>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${
            admission.status === 'ADMITTED'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-green-100 text-green-800'
          }`}>
            {admission.status}
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-3">
          {truncateText(admission.reason, 50)}
        </p>

        <div className="flex justify-between items-center text-xs text-gray-600">
          <span>Admitted: {formatDate(admission.admitted_at)}</span>
          <span className="font-semibold">
            {daysInAdmission} {daysInAdmission === 1 ? 'day' : 'days'}
          </span>
        </div>

        <ChevronRight className="w-4 h-4 text-gray-400 mt-3" />
      </div>
    </Link>
  );
}
