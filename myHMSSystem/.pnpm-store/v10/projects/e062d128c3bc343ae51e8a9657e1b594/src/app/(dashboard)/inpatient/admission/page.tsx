'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAdmission, getWards, getAvailableBeds } from '@/lib/inpatient/api';
import { Ward, Bed } from '@/lib/inpatient/types';
import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, ChevronLeft, Loader2 } from 'lucide-react';

export default function NewAdmissionPage() {
  const router = useRouter();
  const [wards, setWards] = useState<Ward[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [selectedWard, setSelectedWard] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    visit_id: '',
    patient_id: '',
    bed_id: '',
    reason: '',
    ward: '',
    bed_no: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const wardsData = await getWards();
        setWards(wardsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load wards');
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedWard) {
      (async () => {
        try {
          const bedsData = await getAvailableBeds(selectedWard);
          setBeds(bedsData);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load beds');
        }
      })();
    }
  }, [selectedWard]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate all required fields
      if (!formData.visit_id.trim() || !formData.patient_id.trim() || !formData.bed_id.trim()) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Simple UUID validation
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (!uuidRegex.test(formData.patient_id.trim())) {
        setError(`Invalid Patient ID format. Expected UUID like: "123e4567-e89b-12d3-a456-426614174000", got: "${formData.patient_id.trim()}"`);
        setLoading(false);
        return;
      }

      if (!uuidRegex.test(formData.visit_id.trim())) {
        setError(`Invalid Visit ID format. Expected UUID like: "123e4567-e89b-12d3-a456-426614174000", got: "${formData.visit_id.trim()}"`);
        setLoading(false);
        return;
      }

      const selectedBed = beds.find((b) => b.id === formData.bed_id);
      const selectedWardData = wards.find((w) => w.id === selectedWard);

      await createAdmission({
        visit_id: formData.visit_id.trim(),
        patient_id: formData.patient_id.trim(),
        bed_id: formData.bed_id,
        reason: formData.reason,
        ward: selectedWardData?.name,
        bed_no: selectedBed?.bed_number,
      });

      router.push('/dashboard/inpatient');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create admission');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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
          <h1 className="text-3xl font-bold text-gray-900">New Admission</h1>
          <p className="text-gray-600 mt-1">Create a new inpatient admission</p>
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

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient & Visit Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patient ID (UUID) <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="patient_id"
                value={formData.patient_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Format: UUID (e.g., 550e8400-e29b-41d4-a716-446655440000)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Visit ID (UUID) <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="visit_id"
                value={formData.visit_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Format: UUID (e.g., 550e8400-e29b-41d4-a716-446655440000)</p>
            </div>
          </div>

          {/* Ward Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Ward <span className="text-red-600">*</span>
            </label>
            <select
              value={selectedWard}
              onChange={(e) => {
                setSelectedWard(e.target.value);
                setFormData((prev) => ({ ...prev, ward: e.target.value }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- Select a Ward --</option>
              {wards.map((ward) => (
                <option key={ward.id} value={ward.id}>
                  {ward.name}
                </option>
              ))}
            </select>
          </div>

          {/* Bed Selection */}
          {selectedWard && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Bed <span className="text-red-600">*</span>
              </label>
              {beds.length > 0 ? (
                <select
                  name="bed_id"
                  value={formData.bed_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Select a Bed --</option>
                  {beds.map((bed) => (
                    <option key={bed.id} value={bed.id}>
                      {bed.bed_number} (Available)
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
                  No available beds in this ward
                </div>
              )}
            </div>
          )}

          {/* Reason for Admission */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Admission
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Enter chief complaint and reason for admission..."
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating...' : 'Create Admission'}
            </button>
            <Link
              href="/dashboard/inpatient"
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
