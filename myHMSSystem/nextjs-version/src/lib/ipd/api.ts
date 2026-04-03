// IPD Module API Client
import { createClient } from '@supabase/supabase-js'
import type {
  Admission,
  DailyNote,
  Vital,
  Medication,
  MedicationAdministration,
  Procedure,
  DischargeSummary,
  IPDStats,
  AdmissionWithPatient,
  CreateDailyNoteInput,
  CreateVitalInput,
  CreateMedicationInput,
  CreateMedicationAdministrationInput,
  CreateProcedureInput,
  CreateDischargeSummaryInput,
} from './types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ============================================
// ADMISSIONS
// ============================================

export async function getActiveAdmissions(): Promise<AdmissionWithPatient[]> {
  const { data, error } = await supabase
    .from('admissions')
    .select(`
      *,
      patient:patients (id, first_name, last_name)
    `)
    .eq('status', 'ADMITTED')
    .order('admitted_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getAdmissionById(id: string): Promise<Admission | null> {
  const { data, error } = await supabase
    .from('admissions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getAdmissionByIdWithPatient(id: string): Promise<AdmissionWithPatient | null> {
  const { data, error } = await supabase
    .from('admissions')
    .select(`
      *,
      patient:patients (id, first_name, last_name, phone, gender, dob)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// ============================================
// DAILY NOTES
// ============================================

export async function getDailyNotes(admission_id: string): Promise<DailyNote[]> {
  const { data, error } = await supabase
    .from('daily_notes')
    .select('*')
    .eq('admission_id', admission_id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createDailyNote(input: CreateDailyNoteInput): Promise<DailyNote> {
  const { data: userData } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('daily_notes')
    .insert({
      ...input,
      created_by: userData?.user?.id || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateDailyNote(id: string, updates: Partial<DailyNote>): Promise<DailyNote> {
  const { data, error } = await supabase
    .from('daily_notes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteDailyNote(id: string): Promise<void> {
  const { error } = await supabase
    .from('daily_notes')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================
// VITALS
// ============================================

export async function getVitals(admission_id: string): Promise<Vital[]> {
  const { data, error } = await supabase
    .from('vitals')
    .select('*')
    .eq('admission_id', admission_id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getLatestVital(admission_id: string): Promise<Vital | null> {
  const { data, error } = await supabase
    .from('vitals')
    .select('*')
    .eq('admission_id', admission_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function createVital(input: CreateVitalInput): Promise<Vital> {
  const { data, error } = await supabase
    .from('vitals')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================
// MEDICATIONS
// ============================================

export async function getMedications(admission_id: string): Promise<Medication[]> {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('admission_id', admission_id)
    .order('start_date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getActiveMedications(admission_id: string): Promise<Medication[]> {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('admission_id', admission_id)
    .eq('status', 'ACTIVE')
    .order('start_date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createMedication(input: CreateMedicationInput): Promise<Medication> {
  const { data, error } = await supabase
    .from('medications')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateMedicationStatus(id: string, status: string): Promise<Medication> {
  const { data, error } = await supabase
    .from('medications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================
// MEDICATION ADMINISTRATION (MAR)
// ============================================

export async function getMedicationAdministration(medication_id: string): Promise<MedicationAdministration[]> {
  const { data, error } = await supabase
    .from('medication_administration')
    .select('*')
    .eq('medication_id', medication_id)
    .order('administered_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getAdmissionMAR(admission_id: string): Promise<MedicationAdministration[]> {
  const { data, error } = await supabase
    .from('medication_administration')
    .select('*')
    .eq('admission_id', admission_id)
    .order('administered_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createMedicationAdministration(
  input: CreateMedicationAdministrationInput
): Promise<MedicationAdministration> {
  const { data: userData } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('medication_administration')
    .insert({
      ...input,
      administered_by: userData?.user?.id || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================
// PROCEDURES
// ============================================

export async function getProcedures(admission_id: string): Promise<Procedure[]> {
  const { data, error } = await supabase
    .from('procedures')
    .select('*')
    .eq('admission_id', admission_id)
    .order('scheduled_date', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getScheduledProcedures(admission_id: string): Promise<Procedure[]> {
  const { data, error } = await supabase
    .from('procedures')
    .select('*')
    .eq('admission_id', admission_id)
    .in('status', ['SCHEDULED', 'IN_PROGRESS'])
    .order('scheduled_date', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createProcedure(input: CreateProcedureInput): Promise<Procedure> {
  const { data: userData } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('procedures')
    .insert({
      ...input,
      performed_by: userData?.user?.id || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateProcedureStatus(id: string, status: string): Promise<Procedure> {
  const { data, error } = await supabase
    .from('procedures')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateProcedure(id: string, updates: Partial<Procedure>): Promise<Procedure> {
  const { data, error } = await supabase
    .from('procedures')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================
// DISCHARGE SUMMARIES
// ============================================

export async function getDischargeSummary(admission_id: string): Promise<DischargeSummary | null> {
  const { data, error } = await supabase
    .from('discharge_summaries')
    .select('*')
    .eq('admission_id', admission_id)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function createDischargeSummary(
  input: CreateDischargeSummaryInput
): Promise<DischargeSummary> {
  const { data: userData } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('discharge_summaries')
    .insert({
      ...input,
      discharge_date: new Date().toISOString(),
      discharged_by: userData?.user?.id || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================
// IPD STATISTICS
// ============================================

export async function getIPDStats(): Promise<IPDStats> {
  const today = new Date().toISOString().split('T')[0]

  // Active admissions
  const { count: activeCount } = await supabase
    .from('admissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ADMITTED')

  // Discharges today
  const { count: dischargeCount } = await supabase
    .from('admissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'DISCHARGED')
    .gte('discharged_at', `${today}T00:00:00`)
    .lte('discharged_at', `${today}T23:59:59`)

  // Critical notes
  const { count: criticalCount } = await supabase
    .from('daily_notes')
    .select('*', { count: 'exact', head: true })
    .eq('is_critical', true)
    .gte('created_at', `${today}T00:00:00`)

  // Urgent procedures
  const { count: urgentCount } = await supabase
    .from('procedures')
    .select('*', { count: 'exact', head: true })
    .eq('urgency', 'URGENT')
    .in('status', ['SCHEDULED', 'IN_PROGRESS'])

  return {
    total_active_admissions: activeCount || 0,
    total_discharges_today: dischargeCount || 0,
    critical_notes_count: criticalCount || 0,
    urgent_procedures_count: urgentCount || 0,
  }
}

// ============================================
// THEATRE INTEGRATION
// ============================================

export async function getStaffByRole(role: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('staff')
    .select('id, first_name, last_name, specialty')
    .eq('role', role)
    .eq('is_active', true)
    .order('first_name', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createTheatreBooking(input: {
  patient_id: string
  visit_id: string
  procedure_name: string
  procedure_type?: string
  urgency: string
  preferred_date: string
  preferred_time?: string | null
  surgeon_id?: string | null
  anesthetist_id?: string | null
  estimated_duration?: string | null
  special_requirements?: string | null
}): Promise<any> {
  const { data: userData } = await supabase.auth.getUser()
  
  const bookingId = `TH-${Date.now()}`

  const { data, error } = await supabase
    .from('theatre_bookings')
    .insert({
      booking_id: bookingId,
      patient_id: input.patient_id,
      visit_id: input.visit_id,
      department: 'IPD',
      procedure_name: input.procedure_name,
      procedure_category: input.procedure_type || 'SURGERY',
      urgency: (input.urgency || 'elective').toLowerCase(),
      preferred_date: input.preferred_date,
      preferred_time: input.preferred_time || null,
      surgeon_id: input.surgeon_id || null,
      anesthetist_id: input.anesthetist_id || null,
      estimated_duration: input.estimated_duration ? `${input.estimated_duration} minutes` : null,
      status: 'scheduled',
      special_requirements: input.special_requirements || null,
      created_by: userData?.user?.id || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}
