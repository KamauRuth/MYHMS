import { createClient } from '@/lib/supabase/client';
import { ApiResponse, Admission, Ward, Bed } from './types';

const supabase = createClient();

// ==================== WARDS ====================
export async function getWards() {
  const { data, error } = await supabase
    .from('wards')
    .select('*')
    .order('name');

  if (error) throw new Error(error.message);
  return data as Ward[];
}

export async function getWardById(wardId: string) {
  const { data, error } = await supabase
    .from('wards')
    .select('*')
    .eq('id', wardId)
    .single();

  if (error) throw new Error(error.message);
  return data as Ward;
}

export async function createWard(name: string) {
  const { data, error } = await supabase
    .from('wards')
    .insert({ name })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Ward;
}

// ==================== BEDS ====================
export async function getBeds(wardId?: string) {
  let query = supabase.from('beds').select('*, wards(*)');

  if (wardId) {
    query = query.eq('ward_id', wardId);
  }

  const { data, error } = await query.order('bed_number');

  if (error) throw new Error(error.message);
  return data as Bed[];
}

export async function getBedById(bedId: string) {
  const { data, error } = await supabase
    .from('beds')
    .select('*, wards(*)')
    .eq('id', bedId)
    .single();

  if (error) throw new Error(error.message);
  return data as Bed;
}

export async function getAvailableBeds(wardId?: string) {
  let query = supabase
    .from('beds')
    .select('*, wards(*)')
    .eq('status', 'AVAILABLE');

  if (wardId) {
    query = query.eq('ward_id', wardId);
  }

  const { data, error } = await query.order('bed_number');

  if (error) throw new Error(error.message);
  return data as Bed[];
}

export async function createBed(wardId: string, bedNumber: string) {
  const { data, error } = await supabase
    .from('beds')
    .insert({
      ward_id: wardId,
      bed_number: bedNumber,
      status: 'AVAILABLE',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Bed;
}

export async function updateBedStatus(bedId: string, status: 'AVAILABLE' | 'OCCUPIED') {
  const { data, error } = await supabase
    .from('beds')
    .update({ status })
    .eq('id', bedId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Bed;
}

// ==================== ADMISSIONS ====================
export async function getAdmissions(filters?: { wardId?: string; status?: string }) {
  let query = supabase
    .from('admissions')
    .select(`
      *,
      beds(*),
      wards(*)
    `)
    .order('admitted_at', { ascending: false });

  if (filters?.wardId) {
    query = query.eq('bed_id', (await getBeds(filters.wardId))[0]?.id);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data as Admission[];
}

export async function getActiveAdmissions() {
  const { data, error } = await supabase
    .from('admissions')
    .select(`
      *,
      beds(*),
      wards(*)
    `)
    .eq('status', 'ADMITTED')
    .order('admitted_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Admission[];
}

export async function getAdmissionById(admissionId: string) {
  const { data, error } = await supabase
    .from('admissions')
    .select(`
      *,
      beds(*),
      wards(*)
    `)
    .eq('id', admissionId)
    .single();

  if (error) throw new Error(error.message);
  return data as Admission;
}

export async function getPatientAdmissions(patientId: string) {
  const { data, error } = await supabase
    .from('admissions')
    .select(`
      *,
      beds(*),
      wards(*)
    `)
    .eq('patient_id', patientId)
    .order('admitted_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Admission[];
}

export async function createAdmission(admissionData: {
  visit_id: string;
  patient_id: string;
  bed_id: string;
  reason?: string;
  ward?: string;
  bed_no?: string;
}) {
  const { data, error } = await supabase
    .from('admissions')
    .insert({
      ...admissionData,
      status: 'ADMITTED',
      admitted_at: new Date().toISOString(),
    })
    .select('*, beds(*), wards(*)')
    .single();

  if (error) throw new Error(error.message);

  // Update bed status to OCCUPIED
  if (admissionData.bed_id) {
    await updateBedStatus(admissionData.bed_id, 'OCCUPIED');
  }

  return data as Admission;
}

export async function updateAdmission(
  admissionId: string,
  updates: Partial<Admission>
) {
  const { data, error } = await supabase
    .from('admissions')
    .update(updates)
    .eq('id', admissionId)
    .select('*, beds(*), wards(*)')
    .single();

  if (error) throw new Error(error.message);
  return data as Admission;
}

export async function dischargeAdmission(
  admissionId: string,
  dischargeSummary?: string
) {
  const admission = await getAdmissionById(admissionId);

  // Get the bed to free it up
  if (admission.bed_id) {
    await updateBedStatus(admission.bed_id, 'AVAILABLE');
  }

  const { data, error } = await supabase
    .from('admissions')
    .update({
      status: 'DISCHARGED',
      discharged_at: new Date().toISOString(),
      discharge_summary: dischargeSummary || null,
    })
    .eq('id', admissionId)
    .select('*, beds(*), wards(*)')
    .single();

  if (error) throw new Error(error.message);
  return data as Admission;
}

// ==================== STATISTICS ====================
export async function getIPDStats() {
  const [activeAdmissions, beds, wards] = await Promise.all([
    getActiveAdmissions(),
    getBeds(),
    getWards(),
  ]);

  const occupiedBeds = beds.filter((b) => b.status === 'OCCUPIED');
  const availableBeds = beds.filter((b) => b.status === 'AVAILABLE');

  return {
    total_active_admissions: activeAdmissions.length,
    total_beds: beds.length,
    occupied_beds: occupiedBeds.length,
    available_beds: availableBeds.length,
    occupancy_rate: beds.length > 0 ? (occupiedBeds.length / beds.length) * 100 : 0,
    total_wards: wards.length,
  };
}

export async function getWardStats(wardId: string) {
  const wardBeds = await getBeds(wardId);
  const occupiedBeds = wardBeds.filter((b) => b.status === 'OCCUPIED');

  return {
    ward_id: wardId,
    total_beds: wardBeds.length,
    occupied_beds: occupiedBeds.length,
    available_beds: wardBeds.length - occupiedBeds.length,
    occupancy_rate:
      wardBeds.length > 0 ? (occupiedBeds.length / wardBeds.length) * 100 : 0,
  };
}
