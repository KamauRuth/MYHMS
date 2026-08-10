-- ============================================
-- IPD MODULE - COMPREHENSIVE DATABASE SCHEMAS
-- ============================================
-- This script creates all necessary tables for the IPD (Inpatient Department) module
-- Including daily notes, vitals, medications, and procedures

-- ============================================
-- 1. DAILY NOTES TABLE
-- ============================================
-- Track clinical observations and nursing notes during admission
DROP TABLE IF EXISTS public.daily_notes CASCADE;
CREATE TABLE IF NOT EXISTS public.daily_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admission_id uuid NOT NULL,
  created_by uuid NULL, -- User/Staff who created the note
  note_type text NOT NULL CHECK (note_type IN ('NURSING', 'CLINICAL', 'DOCTOR', 'OBSERVATION')),
  title text NULL,
  notes text NOT NULL,
  is_critical boolean DEFAULT false,
  priority text DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT daily_notes_pkey PRIMARY KEY (id),
  CONSTRAINT daily_notes_admission_id_fkey FOREIGN KEY (admission_id)
    REFERENCES public.admissions(id) ON DELETE CASCADE
);

CREATE INDEX idx_daily_notes_admission_id ON public.daily_notes(admission_id);
CREATE INDEX idx_daily_notes_created_at ON public.daily_notes(created_at DESC);
CREATE INDEX idx_daily_notes_note_type ON public.daily_notes(note_type);

-- ============================================
-- 2. MEDICATIONS TABLE (MAR - Medication Administration Record)
-- ============================================
-- Track medications prescribed and administered during admission
DROP TABLE IF EXISTS public.medications CASCADE;
CREATE TABLE IF NOT EXISTS public.medications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admission_id uuid NOT NULL,
  prescribed_by uuid NULL, -- Doctor who prescribed
  drug_id uuid NULL, -- Reference to drug master if available
  drug_name text NOT NULL,
  dosage text NOT NULL, -- e.g., "500mg", "2 tablets"
  frequency text NOT NULL, -- e.g., "TID", "BD", "OD", "Q4H"
  route text NOT NULL CHECK (route IN ('ORAL', 'INTRAVENOUS', 'INTRAMUSCULAR', 'SUBCUTANEOUS', 'TOPICAL', 'INHALED', 'RECTAL', 'SUBLINGUAL')),
  start_date date NOT NULL,
  end_date date NULL,
  indication text NOT NULL, -- Why the medication is prescribed
  special_instructions text NULL,
  is_prn boolean DEFAULT false, -- As needed/PRN
  status text DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DISCONTINUED')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT medications_pkey PRIMARY KEY (id),
  CONSTRAINT medications_admission_id_fkey FOREIGN KEY (admission_id)
    REFERENCES public.admissions(id) ON DELETE CASCADE
);

CREATE INDEX idx_medications_admission_id ON public.medications(admission_id);
CREATE INDEX idx_medications_status ON public.medications(status);
CREATE INDEX idx_medications_start_date ON public.medications(start_date);

-- ============================================
-- 3. MEDICATION ADMINISTRATION TABLE
-- ============================================
-- Track each actual administration of medications
DROP TABLE IF EXISTS public.medication_administration CASCADE;
CREATE TABLE IF NOT EXISTS public.medication_administration (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  medication_id uuid NOT NULL,
  admission_id uuid NOT NULL,
  administered_by uuid NULL, -- Nurse who administered
  administered_at timestamp with time zone NOT NULL,
  was_administered boolean NOT NULL DEFAULT true,
  reason_not_given text NULL, -- If not administered, why
  reason_not_given_code text CHECK (reason_not_given_code IN ('PATIENT_REFUSED', 'PATIENT_NPO', 'PATIENT_ASLEEP', 'MEDICATION_UNAVAILABLE', 'OTHER')),
  site text NULL, -- For injections (left arm, right arm, etc.)
  notes text NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT medication_administration_pkey PRIMARY KEY (id),
  CONSTRAINT medication_administration_medication_id_fkey FOREIGN KEY (medication_id)
    REFERENCES public.medications(id) ON DELETE CASCADE,
  CONSTRAINT medication_administration_admission_id_fkey FOREIGN KEY (admission_id)
    REFERENCES public.admissions(id) ON DELETE CASCADE
);

CREATE INDEX idx_medication_administration_medication_id ON public.medication_administration(medication_id);
CREATE INDEX idx_medication_administration_admission_id ON public.medication_administration(admission_id);
CREATE INDEX idx_medication_administration_administered_at ON public.medication_administration(administered_at DESC);

-- ============================================
-- 4. PROCEDURES TABLE
-- ============================================
-- Track surgical/medical procedures performed during admission
DROP TABLE IF EXISTS public.procedures CASCADE;
CREATE TABLE IF NOT EXISTS public.procedures (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admission_id uuid NOT NULL,
  procedure_name text NOT NULL,
  procedure_code text NULL, -- ICD code if available
  performed_by uuid NULL, -- Surgeon/Doctor
  scheduled_date date NOT NULL,
  scheduled_time time NULL,
  actual_start_time timestamp with time zone NULL,
  actual_end_time timestamp with time zone NULL,
  location text NULL, -- Theatre name/location
  procedure_type text NOT NULL CHECK (procedure_type IN ('SURGERY', 'MINOR_PROCEDURE', 'DIAGNOSTIC', 'THERAPEUTIC')),
  urgency text DEFAULT 'ELECTIVE' CHECK (urgency IN ('EMERGENCY', 'URGENT', 'ELECTIVE')),
  indication text NOT NULL, -- Why the procedure is needed
  pre_operative_notes text NULL,
  post_operative_notes text NULL,
  complications text NULL,
  status text DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED')),
  cancellation_reason text NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT procedures_pkey PRIMARY KEY (id),
  CONSTRAINT procedures_admission_id_fkey FOREIGN KEY (admission_id)
    REFERENCES public.admissions(id) ON DELETE CASCADE
);

CREATE INDEX idx_procedures_admission_id ON public.procedures(admission_id);
CREATE INDEX idx_procedures_scheduled_date ON public.procedures(scheduled_date);
CREATE INDEX idx_procedures_status ON public.procedures(status);

-- ============================================
-- 5. PROCEDURE TEAM TABLE
-- ============================================
-- Track staff involved in procedures
DROP TABLE IF EXISTS public.procedure_team CASCADE;
CREATE TABLE IF NOT EXISTS public.procedure_team (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  procedure_id uuid NOT NULL,
  staff_id uuid NULL,
  staff_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('SURGEON', 'ANESTHETIST', 'ASSISTANT', 'NURSE', 'TECHNICIAN')),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT procedure_team_pkey PRIMARY KEY (id),
  CONSTRAINT procedure_team_procedure_id_fkey FOREIGN KEY (procedure_id)
    REFERENCES public.procedures(id) ON DELETE CASCADE
);

CREATE INDEX idx_procedure_team_procedure_id ON public.procedure_team(procedure_id);

-- ============================================
-- 6. DISCHARGE SUMMARIES TABLE
-- ============================================
-- Comprehensive discharge documentation
DROP TABLE IF EXISTS public.discharge_summaries CASCADE;
CREATE TABLE IF NOT EXISTS public.discharge_summaries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admission_id uuid NOT NULL UNIQUE,
  discharged_by uuid NULL, -- Doctor authorizing discharge
  discharge_date timestamp with time zone NOT NULL,
  discharge_type text NOT NULL CHECK (discharge_type IN ('RECOVERED', 'IMPROVED', 'REFERRED', 'ABSCONDED', 'EXPIRED', 'DISCHARGED_AGAINST_ADVICE')),
  primary_diagnosis text NOT NULL,
  secondary_diagnoses text NULL, -- JSON array or comma-separated
  procedures_performed text NULL,
  final_status text NULL,
  discharge_condition text NOT NULL CHECK (discharge_condition IN ('GOOD', 'FAIR', 'POOR')),
  discharge_medication text NULL, -- Medications to continue at home
  follow_up_instructions text NULL,
  follow_up_date date NULL,
  follow_up_department text NULL,
  clinical_summary text NOT NULL, -- Overall clinical summary
  investigations_done text NULL,
  investigation_results text NULL,
  advice_given text NULL,
  patient_education text NULL,
  referral_details text NULL,
  destination text NULL, -- Home, Other hospital, etc.
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT discharge_summaries_pkey PRIMARY KEY (id),
  CONSTRAINT discharge_summaries_admission_id_fkey FOREIGN KEY (admission_id)
    REFERENCES public.admissions(id) ON DELETE CASCADE
);

CREATE INDEX idx_discharge_summaries_admission_id ON public.discharge_summaries(admission_id);
CREATE INDEX idx_discharge_summaries_discharge_date ON public.discharge_summaries(discharge_date DESC);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Verify all tables are created:
SELECT 'daily_notes' as table_name, COUNT(*) as count FROM public.daily_notes
UNION ALL
SELECT 'medications' as table_name, COUNT(*) as count FROM public.medications
UNION ALL
SELECT 'medication_administration' as table_name, COUNT(*) as count FROM public.medication_administration
UNION ALL
SELECT 'procedures' as table_name, COUNT(*) as count FROM public.procedures
UNION ALL
SELECT 'procedure_team' as table_name, COUNT(*) as count FROM public.procedure_team
UNION ALL
SELECT 'discharge_summaries' as table_name, COUNT(*) as count FROM public.discharge_summaries;
