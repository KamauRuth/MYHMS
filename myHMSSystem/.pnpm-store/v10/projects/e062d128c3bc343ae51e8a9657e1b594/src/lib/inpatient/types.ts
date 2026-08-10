export type WardType = 'general' | 'icu' | 'pediatric' | 'maternity';
export type BedStatus = 'AVAILABLE' | 'OCCUPIED';
export type AdmissionStatus = 'ADMITTED' | 'DISCHARGED';

// Ward
export interface Ward {
  id: string;
  name: string;
  created_at: string;
}

// Bed
export interface Bed {
  id: string;
  ward_id: string;
  bed_number: string;
  status: BedStatus;
  created_at: string;
  wards?: Ward;
}

// Admission
export interface Admission {
  id: string;
  visit_id: string;
  patient_id: string;
  ward?: string;
  bed_no?: string;
  reason?: string;
  status: AdmissionStatus;
  admitted_at: string;
  discharged_at?: string;
  discharge_summary?: string;
  bed_id?: string;
  beds?: Bed;
  wards?: Ward;
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Statistics
export interface IPDStats {
  total_active_admissions: number;
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  occupancy_rate: number;
  total_wards: number;
}

export interface WardStats {
  ward_id: string;
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  occupancy_rate: number;
}
