// IPD Module Types

// Admissions (existing)
export interface Admission {
  id: string
  visit_id: string
  patient_id: string
  bed_id: string
  ward: string
  reason: string
  status: 'ADMITTED' | 'DISCHARGED'
  admitted_at: string
  discharged_at: string | null
  discharge_summary: string | null
}

// Daily Notes
export interface DailyNote {
  id: string
  admission_id: string
  created_by: string | null
  note_type: 'NURSING' | 'CLINICAL' | 'DOCTOR' | 'OBSERVATION'
  title: string | null
  notes: string
  is_critical: boolean
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  created_at: string
  updated_at: string
}

export interface CreateDailyNoteInput {
  admission_id: string
  note_type: 'NURSING' | 'CLINICAL' | 'DOCTOR' | 'OBSERVATION'
  title?: string
  notes: string
  is_critical?: boolean
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
}

// Vitals
export interface Vital {
  id: string
  admission_id: string
  temperature: number | null
  bp_systolic: number | null
  bp_diastolic: number | null
  pulse: number | null
  spo2: number | null
  created_at: string
}

export interface CreateVitalInput {
  admission_id: string
  temperature?: number
  bp_systolic?: number
  bp_diastolic?: number
  pulse?: number
  spo2?: number
}

// Medications
export interface Medication {
  id: string
  admission_id: string
  prescribed_by: string | null
  drug_id: string | null
  drug_name: string
  dosage: string
  frequency: string
  route: 'ORAL' | 'INTRAVENOUS' | 'INTRAMUSCULAR' | 'SUBCUTANEOUS' | 'TOPICAL' | 'INHALED' | 'RECTAL' | 'SUBLINGUAL'
  start_date: string
  end_date: string | null
  indication: string
  special_instructions: string | null
  is_prn: boolean
  status: 'ACTIVE' | 'SUSPENDED' | 'DISCONTINUED'
  created_at: string
  updated_at: string
}

export interface CreateMedicationInput {
  admission_id: string
  drug_name: string
  dosage: string
  frequency: string
  route: string
  start_date: string
  indication: string
  special_instructions?: string
  is_prn?: boolean
  prescribed_by?: string
}

// Medication Administration (MAR)
export interface MedicationAdministration {
  id: string
  medication_id: string
  admission_id: string
  administered_by: string | null
  administered_at: string
  was_administered: boolean
  reason_not_given: string | null
  reason_not_given_code: string | null
  site: string | null
  notes: string | null
  created_at: string
}

export interface CreateMedicationAdministrationInput {
  medication_id: string
  admission_id: string
  administered_at: string
  was_administered: boolean
  reason_not_given?: string
  reason_not_given_code?: string
  site?: string
  notes?: string
}

// Procedures
export interface Procedure {
  id: string
  admission_id: string
  procedure_name: string
  procedure_code: string | null
  performed_by: string | null
  scheduled_date: string
  scheduled_time: string | null
  actual_start_time: string | null
  actual_end_time: string | null
  location: string | null
  procedure_type: 'SURGERY' | 'MINOR_PROCEDURE' | 'DIAGNOSTIC' | 'THERAPEUTIC'
  urgency: 'EMERGENCY' | 'URGENT' | 'ELECTIVE'
  indication: string
  pre_operative_notes: string | null
  post_operative_notes: string | null
  complications: string | null
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED'
  cancellation_reason: string | null
  created_at: string
  updated_at: string
}

export interface CreateProcedureInput {
  admission_id: string
  procedure_name: string
  scheduled_date: string
  procedure_type: string
  urgency?: string
  indication: string
  pre_operative_notes?: string
}

// Procedure Team
export interface ProcedureTeam {
  id: string
  procedure_id: string
  staff_id: string | null
  staff_name: string
  role: 'SURGEON' | 'ANESTHETIST' | 'ASSISTANT' | 'NURSE' | 'TECHNICIAN'
  created_at: string
}

// Discharge Summary
export interface DischargeSummary {
  id: string
  admission_id: string
  discharged_by: string | null
  discharge_date: string
  discharge_type: 'RECOVERED' | 'IMPROVED' | 'REFERRED' | 'ABSCONDED' | 'EXPIRED' | 'DISCHARGED_AGAINST_ADVICE'
  primary_diagnosis: string
  secondary_diagnoses: string | null
  procedures_performed: string | null
  final_status: string | null
  discharge_condition: 'GOOD' | 'FAIR' | 'POOR'
  discharge_medication: string | null
  follow_up_instructions: string | null
  follow_up_date: string | null
  follow_up_department: string | null
  clinical_summary: string
  investigations_done: string | null
  investigation_results: string | null
  advice_given: string | null
  patient_education: string | null
  referral_details: string | null
  destination: string | null
  created_at: string
  updated_at: string
}

export interface CreateDischargeSummaryInput {
  admission_id: string
  discharge_type: string
  primary_diagnosis: string
  discharge_condition: string
  clinical_summary: string
  secondary_diagnoses?: string
  procedures_performed?: string
  discharge_medication?: string
  follow_up_instructions?: string
  follow_up_date?: string
  follow_up_department?: string
}

// Dashboard Stats
export interface IPDStats {
  total_active_admissions: number
  total_discharges_today: number
  critical_notes_count: number
  urgent_procedures_count: number
}

// Extended types for UI
export interface AdmissionWithPatient extends Admission {
  patient?: {
    id: string
    first_name: string
    last_name: string
  }
}

export interface AdmissionDetail extends Admission {
  daily_notes: DailyNote[]
  vitals: Vital[]
  medications: Medication[]
  procedures: Procedure[]
  discharge_summary: DischargeSummary | null
}
