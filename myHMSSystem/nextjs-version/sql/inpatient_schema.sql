-- ============================================
-- INPATIENT MODULE (IPD) - COMPREHENSIVE DATABASE SCHEMA
-- ============================================
-- This schema manages inpatient admissions, wards, beds, medical records, and discharges

-- ============================================
-- 1. WARD MASTER TABLE
-- ============================================
DROP TABLE IF EXISTS public.wards CASCADE;
CREATE TABLE IF NOT EXISTS public.wards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ward_name text NOT NULL UNIQUE,
  ward_code text NOT NULL UNIQUE,
  ward_type text NOT NULL CHECK (ward_type IN ('general', 'pediatric', 'maternity', 'icu', 'hdu', 'burn', 'isolation', 'psychiatric')),
  total_beds integer NOT NULL,
  available_beds integer NOT NULL DEFAULT 0,
  department_id text NULL,
  floor_number integer NULL,
  location_description text NULL,
  is_active boolean DEFAULT true,
  notes text NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT wards_pkey PRIMARY KEY (id)
);

-- ============================================
-- 2. BED MASTER TABLE
-- ============================================
DROP TABLE IF EXISTS public.beds CASCADE;
CREATE TABLE IF NOT EXISTS public.beds (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bed_number text NOT NULL,
  ward_id uuid NOT NULL,
  bed_status text NOT NULL DEFAULT 'available' CHECK (bed_status IN ('available', 'occupied', 'maintenance', 'reserved')),
  features text NULL, -- e.g., "oxygen_outlet,suction,cardiac_monitor"
  bed_type text NOT NULL DEFAULT 'general' CHECK (bed_type IN ('general', 'icu', 'hdu', 'isolation', 'pediatric')),
  maintenance_notes text NULL,
  last_maintenance_date timestamp with time zone NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT beds_pkey PRIMARY KEY (id),
  CONSTRAINT beds_ward_fk FOREIGN KEY (ward_id) REFERENCES public.wards(id) ON DELETE CASCADE,
  CONSTRAINT beds_unique_bed_number UNIQUE (ward_id, bed_number)
);

-- ============================================
-- 3. INPATIENT ADMISSIONS TABLE
-- ============================================
DROP TABLE IF EXISTS public.inpatient_admissions CASCADE;
CREATE TABLE IF NOT EXISTS public.inpatient_admissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admission_number text NOT NULL UNIQUE,
  patient_id uuid NOT NULL,
  visit_id uuid NULL, -- Link to OPD visit if applicable
  admission_date timestamp with time zone NOT NULL DEFAULT now(),
  discharge_date timestamp with time zone NULL,
  ward_id uuid NOT NULL,
  bed_id uuid NOT NULL,
  admission_type text NOT NULL CHECK (admission_type IN ('emergency', 'planned', 'transfer')),
  source_department text NULL, -- OPD, ER, Theatre, etc.
  primary_diagnosis text NOT NULL,
  secondary_diagnosis text NULL,
  chief_complaint text NOT NULL,
  admission_notes text NULL,
  referring_doctor_id text NULL,
  attending_doctor_id text NOT NULL,
  assigned_nurse_id text NULL,
  admission_status text NOT NULL DEFAULT 'active' CHECK (admission_status IN ('active', 'transferred', 'discharged')),
  assigned_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT inpatient_admissions_pkey PRIMARY KEY (id),
  CONSTRAINT inpatient_admissions_patient_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE,
  CONSTRAINT inpatient_admissions_ward_fk FOREIGN KEY (ward_id) REFERENCES public.wards(id),
  CONSTRAINT inpatient_admissions_bed_fk FOREIGN KEY (bed_id) REFERENCES public.beds(id)
);

-- ============================================
-- 4. DAILY MEDICAL NOTES (SOAP NOTES)
-- ============================================
DROP TABLE IF EXISTS public.inpatient_daily_notes CASCADE;
CREATE TABLE IF NOT EXISTS public.inpatient_daily_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admission_id uuid NOT NULL,
  note_date date NOT NULL DEFAULT CURRENT_DATE,
  shift text NOT NULL CHECK (shift IN ('morning', 'afternoon', 'night')),
  subjective text NULL, -- Patient's symptoms/complaints
  objective text NULL, -- Vital signs, observations
  assessment text NULL, -- Diagnosis/assessment
  plan text NULL, -- Treatment plan
  noted_by_id text NOT NULL,
  medical_officer_review boolean DEFAULT false,
  reviewed_by_id text NULL,
  reviewed_at timestamp with time zone NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT inpatient_daily_notes_pkey PRIMARY KEY (id),
  CONSTRAINT inpatient_daily_notes_admission_fk FOREIGN KEY (admission_id) REFERENCES public.inpatient_admissions(id) ON DELETE CASCADE
);

-- ============================================
-- 5. VITAL SIGNS DURING STAY
-- ============================================
DROP TABLE IF EXISTS public.inpatient_vital_signs CASCADE;
CREATE TABLE IF NOT EXISTS public.inpatient_vital_signs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admission_id uuid NOT NULL,
  vital_date timestamp with time zone NOT NULL DEFAULT now(),
  temperature_celsius decimal(5,2) NULL,
  pulse_rate integer NULL,
  respiratory_rate integer NULL,
  systolic_bp integer NULL,
  diastolic_bp integer NULL,
  oxygen_saturation decimal(5,2) NULL,
  blood_glucose decimal(7,2) NULL,
  weight_kg decimal(7,2) NULL,
  height_cm decimal(5,2) NULL,
  recorded_by_id text NOT NULL,
  notes text NULL,
  is_abnormal boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT inpatient_vital_signs_pkey PRIMARY KEY (id),
  CONSTRAINT inpatient_vital_signs_admission_fk FOREIGN KEY (admission_id) REFERENCES public.inpatient_admissions(id) ON DELETE CASCADE
);

-- ============================================
-- 6. INPATIENT MEDICATIONS
-- ============================================
DROP TABLE IF EXISTS public.inpatient_medications CASCADE;
CREATE TABLE IF NOT EXISTS public.inpatient_medications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admission_id uuid NOT NULL,
  drug_id uuid NOT NULL,
  dosage text NOT NULL, -- e.g., "500mg"
  frequency text NOT NULL, -- e.g., "8 hourly", "12 hourly", "OD", "BD", "TDS", "QID"
  route text NOT NULL CHECK (route IN ('oral', 'iv', 'im', 'sc', 'topical', 'inhalation', 'rectal')),
  duration_days integer NULL,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NULL,
  special_instructions text NULL,
  prescribed_by_id text NOT NULL,
  prescribed_date timestamp with time zone NOT NULL DEFAULT now(),
  administered_by_id text NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'discontinued', 'completed')),
  discontinuation_reason text NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT inpatient_medications_pkey PRIMARY KEY (id),
  CONSTRAINT inpatient_medications_admission_fk FOREIGN KEY (admission_id) REFERENCES public.inpatient_admissions(id) ON DELETE CASCADE,
  CONSTRAINT inpatient_medications_drug_fk FOREIGN KEY (drug_id) REFERENCES public.drugs(id)
);

-- ============================================
-- 7. MEDICATION ADMINISTRATION RECORD (MAR)
-- ============================================
DROP TABLE IF EXISTS public.inpatient_mar CASCADE;
CREATE TABLE IF NOT EXISTS public.inpatient_mar (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  medication_id uuid NOT NULL,
  scheduled_date date NOT NULL,
  scheduled_time time NOT NULL,
  administered_date timestamp with time zone NULL,
  administered_by_id text NULL,
  administration_status text NOT NULL DEFAULT 'scheduled' CHECK (administration_status IN ('scheduled', 'administered', 'missed', 'refused', 'held')),
  reason_not_given text NULL,
  patient_response text NULL,
  notes text NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT inpatient_mar_pkey PRIMARY KEY (id),
  CONSTRAINT inpatient_mar_medication_fk FOREIGN KEY (medication_id) REFERENCES public.inpatient_medications(id) ON DELETE CASCADE
);

-- ============================================
-- 8. INPATIENT PROCEDURES
-- ============================================
DROP TABLE IF EXISTS public.inpatient_procedures CASCADE;
CREATE TABLE IF NOT EXISTS public.inpatient_procedures (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admission_id uuid NOT NULL,
  procedure_name text NOT NULL,
  procedure_code text NULL,
  procedure_date timestamp with time zone NOT NULL,
  performed_by_id text NOT NULL,
  assisted_by_id text NULL,
  pre_procedure_notes text NULL,
  findings text NULL,
  post_procedure_notes text NULL,
  complications text NULL,
  materials_used text NULL, -- e.g., catheter size, stent details
  outcome text NOT NULL CHECK (outcome IN ('successful', 'partial', 'failed', 'incomplete')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT inpatient_procedures_pkey PRIMARY KEY (id),
  CONSTRAINT inpatient_procedures_admission_fk FOREIGN KEY (admission_id) REFERENCES public.inpatient_admissions(id) ON DELETE CASCADE
);

-- ============================================
-- 9. DISCHARGE SUMMARY
-- ============================================
DROP TABLE IF EXISTS public.discharge_summaries CASCADE;
CREATE TABLE IF NOT EXISTS public.discharge_summaries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admission_id uuid NOT NULL,
  discharge_date timestamp with time zone NOT NULL DEFAULT now(),
  discharge_type text NOT NULL CHECK (discharge_type IN ('LAMA', 'recovered', 'transferred', 'expired', 'referred')),
  reason_for_discharge text NOT NULL,
  final_diagnosis text NOT NULL,
  procedures_done text NULL,
  investigations_done text NULL,
  treatment_summary text NOT NULL,
  discharge_medications text NULL, -- JSON or comma-separated
  follow_up_instructions text NULL,
  restrictions text NULL,
  activity_level text NULL,
  diet_recommendations text NULL,
  return_visit_date date NULL,
  referral_details text NULL,
  discharged_by_id text NOT NULL,
  patient_condition_on_discharge text NOT NULL CHECK (patient_condition_on_discharge IN ('improved', 'stable', 'unchanged', 'worsened')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT discharge_summaries_pkey PRIMARY KEY (id),
  CONSTRAINT discharge_summaries_admission_fk FOREIGN KEY (admission_id) REFERENCES public.inpatient_admissions(id) ON DELETE CASCADE,
  CONSTRAINT discharge_summaries_unique_admission UNIQUE (admission_id)
);

-- ============================================
-- 10. INPATIENT LAB REQUESTS
-- ============================================
DROP TABLE IF EXISTS public.inpatient_lab_requests CASCADE;
CREATE TABLE IF NOT EXISTS public.inpatient_lab_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admission_id uuid NOT NULL,
  test_name text NOT NULL,
  test_code text NULL,
  requested_date timestamp with time zone NOT NULL DEFAULT now(),
  requested_by_id text NOT NULL,
  sample_type text NOT NULL, -- blood, urine, etc.
  urgency text NOT NULL DEFAULT 'routine' CHECK (urgency IN ('routine', 'urgent', 'stat')),
  clinical_notes text NULL,
  result text NULL,
  result_date timestamp with time zone NULL,
  reference_range text NULL,
  result_entered_by_id text NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT inpatient_lab_requests_pkey PRIMARY KEY (id),
  CONSTRAINT inpatient_lab_requests_admission_fk FOREIGN KEY (admission_id) REFERENCES public.inpatient_admissions(id) ON DELETE CASCADE
);

-- ============================================
-- 11. INPATIENT IMAGING REQUESTS
-- ============================================
DROP TABLE IF EXISTS public.inpatient_imaging_requests CASCADE;
CREATE TABLE IF NOT EXISTS public.inpatient_imaging_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admission_id uuid NOT NULL,
  modality text NOT NULL CHECK (modality IN ('xray', 'ct', 'mri', 'ultrasound', 'ecg', 'echo')),
  body_part text NOT NULL,
  requested_date timestamp with time zone NOT NULL DEFAULT now(),
  requested_by_id text NOT NULL,
  clinical_indication text NOT NULL,
  urgency text NOT NULL DEFAULT 'routine' CHECK (urgency IN ('routine', 'urgent', 'stat')),
  findings text NULL,
  impression text NULL,
  reported_by_id text NULL,
  report_date timestamp with time zone NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  image_url text NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT inpatient_imaging_requests_pkey PRIMARY KEY (id),
  CONSTRAINT inpatient_imaging_requests_admission_fk FOREIGN KEY (admission_id) REFERENCES public.inpatient_admissions(id) ON DELETE CASCADE
);

-- ============================================
-- 12. TRANSFER RECORDS (Between Wards)
-- ============================================
DROP TABLE IF EXISTS public.inpatient_transfers CASCADE;
CREATE TABLE IF NOT EXISTS public.inpatient_transfers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admission_id uuid NOT NULL,
  from_ward_id uuid NOT NULL,
  from_bed_id uuid NOT NULL,
  to_ward_id uuid NOT NULL,
  to_bed_id uuid NOT NULL,
  transfer_date timestamp with time zone NOT NULL DEFAULT now(),
  transfer_reason text NOT NULL,
  transfer_approved_by_id text NOT NULL,
  clinical_notes text NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT inpatient_transfers_pkey PRIMARY KEY (id),
  CONSTRAINT inpatient_transfers_admission_fk FOREIGN KEY (admission_id) REFERENCES public.inpatient_admissions(id) ON DELETE CASCADE,
  CONSTRAINT inpatient_transfers_from_ward_fk FOREIGN KEY (from_ward_id) REFERENCES public.wards(id),
  CONSTRAINT inpatient_transfers_to_ward_fk FOREIGN KEY (to_ward_id) REFERENCES public.wards(id),
  CONSTRAINT inpatient_transfers_from_bed_fk FOREIGN KEY (from_bed_id) REFERENCES public.beds(id),
  CONSTRAINT inpatient_transfers_to_bed_fk FOREIGN KEY (to_bed_id) REFERENCES public.beds(id)
);

-- ============================================
-- 13. VISITOR LOG
-- ============================================
DROP TABLE IF EXISTS public.visitor_logs CASCADE;
CREATE TABLE IF NOT EXISTS public.visitor_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admission_id uuid NOT NULL,
  visitor_name text NOT NULL,
  relationship text NULL,
  phone text NULL,
  visit_in timestamp with time zone NOT NULL DEFAULT now(),
  visit_out timestamp with time zone NULL,
  notes text NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT visitor_logs_pkey PRIMARY KEY (id),
  CONSTRAINT visitor_logs_admission_fk FOREIGN KEY (admission_id) REFERENCES public.inpatient_admissions(id) ON DELETE CASCADE
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_inpatient_admissions_patient_id ON public.inpatient_admissions(patient_id);
CREATE INDEX idx_inpatient_admissions_admission_date ON public.inpatient_admissions(admission_date);
CREATE INDEX idx_inpatient_admissions_status ON public.inpatient_admissions(admission_status);
CREATE INDEX idx_beds_ward_id_status ON public.beds(ward_id, bed_status);
CREATE INDEX idx_inpatient_daily_notes_admission_date ON public.inpatient_daily_notes(admission_id, note_date);
CREATE INDEX idx_inpatient_vital_signs_admission ON public.inpatient_vital_signs(admission_id, vital_date);
CREATE INDEX idx_inpatient_medications_admission ON public.inpatient_medications(admission_id, status);
CREATE INDEX idx_discharge_summaries_admission_id ON public.discharge_summaries(admission_id);

-- ============================================
-- SAMPLE DATA - WARDS
-- ============================================
INSERT INTO public.wards (ward_name, ward_code, ward_type, total_beds, available_beds, floor_number, is_active)
VALUES 
  ('General Ward', 'GWD', 'general', 20, 8, 1, true),
  ('ICU Ward', 'ICU', 'icu', 10, 2, 2, true),
  ('Pediatric Ward', 'PED', 'pediatric', 15, 5, 1, true),
  ('Maternity Ward', 'MAT', 'maternity', 12, 3, 3, true)
ON CONFLICT DO NOTHING;

-- Insert beds for General Ward (assuming ward_id for General Ward is the first one)
INSERT INTO public.beds (bed_number, ward_id, bed_type, bed_status, is_active)
SELECT 
  'B' || generate_series(1, 20),
  w.id,
  'general',
  'available',
  true
FROM public.wards w WHERE w.ward_code = 'GWD'
ON CONFLICT (ward_id, bed_number) DO NOTHING;
