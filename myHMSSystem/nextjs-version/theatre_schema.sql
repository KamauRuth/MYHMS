-- Theatre Module Database Schema for LIFEPOINT HOSPITAL HMS

-- Staff Table (Role-based staff management for HMS)
CREATE TABLE IF NOT EXISTS public.staff (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NULL, -- Link to existing users table if available
  staff_id text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text NULL,
  role text NOT NULL CHECK (role IN ('super_admin', 'admin', 'doctor', 'nurse', 'technician', 'pharmacist', 'lab_technician', 'receptionist', 'surgeon', 'anesthetist', 'scrub_nurse', 'circulating_nurse', 'theatre_technician', 'recovery_nurse')),
  specialty text NULL, -- For doctors/surgeons/anesthetists
  department text NULL, -- Theatre, OPD, IPD, Laboratory, Pharmacy, etc.
  license_number text NULL,
  license_expiry date NULL,
  qualifications text NULL, -- JSON array of qualifications/certifications
  experience_years integer DEFAULT 0,
  is_active boolean DEFAULT true,
  is_available boolean DEFAULT true, -- For scheduling
  hire_date date NULL,
  salary decimal(10,2) NULL,
  emergency_contact_name text NULL,
  emergency_contact_phone text NULL,
  created_by uuid NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT staff_pkey PRIMARY KEY (id),
  CONSTRAINT staff_email_unique UNIQUE (email),
  CONSTRAINT staff_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.users(id) ON DELETE SET NULL
);

-- Pharmacy Stock Table (for theatre consumables integration)
CREATE TABLE IF NOT EXISTS public.pharmacy_stock (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  item_name text NOT NULL,
  generic_name text NULL,
  category text NOT NULL, -- drug, consumable, implant, equipment
  batch_number text NULL,
  expiry_date date NULL,
  current_stock decimal(10,2) NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'pieces',
  unit_cost decimal(10,2) NULL,
  selling_price decimal(10,2) NULL,
  supplier text NULL,
  location text NULL,
  min_stock_level decimal(10,2) DEFAULT 0,
  max_stock_level decimal(10,2) NULL,
  requires_prescription boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pharmacy_stock_pkey PRIMARY KEY (id)
);

-- Theatre Bookings Table
CREATE TABLE IF NOT EXISTS public.theatre_bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id text NOT NULL UNIQUE,
  patient_id uuid NOT NULL,
  visit_id uuid NOT NULL,
  department text NOT NULL, -- OPD, IPD, Maternity, Emergency
  procedure_name text NOT NULL,
  procedure_category text NULL,
  urgency text NOT NULL DEFAULT 'elective' CHECK (urgency IN ('elective', 'urgent', 'emergency')),
  preferred_date date NOT NULL,
  preferred_time time NULL,
  surgeon_id uuid NULL REFERENCES public.staff(id),
  anesthetist_id uuid NULL REFERENCES public.staff(id),
  estimated_duration interval NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'prepped', 'in_surgery', 'recovery', 'completed', 'cancelled')),
  special_requirements text NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT theatre_bookings_pkey PRIMARY KEY (id),
  CONSTRAINT theatre_bookings_patient_id_fkey FOREIGN KEY (patient_id)
    REFERENCES public.patients(id) ON DELETE CASCADE,
  CONSTRAINT theatre_bookings_visit_id_fkey FOREIGN KEY (visit_id)
    REFERENCES public.visits(id) ON DELETE CASCADE
);

-- Theatre Cases Table (when surgery actually happens)
CREATE TABLE IF NOT EXISTS public.theatre_cases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  case_id text NOT NULL UNIQUE,
  booking_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  surgeon_id uuid NOT NULL REFERENCES public.staff(id),
  anesthetist_id uuid NOT NULL REFERENCES public.staff(id),
  procedure_performed text NOT NULL,
  incision_type text NULL,
  findings text NULL,
  complications text NULL,
  estimated_blood_loss text NULL,
  specimens_sent text NULL,
  closure_details text NULL,
  time_in timestamp with time zone NOT NULL,
  time_out timestamp with time zone NULL,
  surgery_duration interval NULL,
  theatre_utilization_time interval NULL,
  status text NOT NULL DEFAULT 'prepped', -- prepped, in_theatre, in_surgery, recovery, completed, cancelled
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT theatre_cases_pkey PRIMARY KEY (id),
  CONSTRAINT theatre_cases_booking_id_fkey FOREIGN KEY (booking_id)
    REFERENCES public.theatre_bookings(id) ON DELETE CASCADE,
  CONSTRAINT theatre_cases_patient_id_fkey FOREIGN KEY (patient_id)
    REFERENCES public.patients(id) ON DELETE CASCADE,
  CONSTRAINT theatre_cases_surgeon_id_fkey FOREIGN KEY (surgeon_id)
    REFERENCES public.staff(id) ON DELETE CASCADE,
  CONSTRAINT theatre_cases_anesthetist_id_fkey FOREIGN KEY (anesthetist_id)
    REFERENCES public.staff(id) ON DELETE CASCADE
);

-- Theatre Team Accountability
CREATE TABLE IF NOT EXISTS public.theatre_team (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('surgeon', 'assistant_surgeon', 'anesthetist', 'scrub_nurse', 'circulating_nurse', 'theatre_technician', 'recovery_nurse')),
  staff_id uuid NOT NULL REFERENCES public.staff(id),
  staff_name text NOT NULL,
  time_in timestamp with time zone NULL,
  time_out timestamp with time zone NULL,
  responsibilities text NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT theatre_team_pkey PRIMARY KEY (id),
  CONSTRAINT theatre_team_case_id_fkey FOREIGN KEY (case_id)
    REFERENCES public.theatre_cases(id) ON DELETE CASCADE,
  CONSTRAINT theatre_team_staff_id_fkey FOREIGN KEY (staff_id)
    REFERENCES public.staff(id) ON DELETE CASCADE
);

-- Surgery Notes (Surgeon documentation)
CREATE TABLE IF NOT EXISTS public.surgery_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL,
  note_type text NOT NULL, -- pre_op, intra_op, post_op
  diagnosis text NULL,
  indication text NULL,
  consent_confirmed boolean DEFAULT false,
  risks_explained text NULL,
  pre_op_plan text NULL,
  procedure_details text NULL,
  findings text NULL,
  complications text NULL,
  closure_details text NULL,
  post_op_orders jsonb NULL, -- antibiotics, iv_fluids, analgesics, monitoring
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT surgery_notes_pkey PRIMARY KEY (id),
  CONSTRAINT surgery_notes_case_id_fkey FOREIGN KEY (case_id)
    REFERENCES public.theatre_cases(id) ON DELETE CASCADE
);

-- Anesthesia Records
CREATE TABLE IF NOT EXISTS public.anesthesia_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL,
  asa_classification text NULL,
  airway_assessment text NULL,
  allergies text NULL,
  risk_factors text NULL,
  anesthesia_type text NULL,
  induction_time timestamp with time zone NULL,
  emergence_time timestamp with time zone NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT anesthesia_records_pkey PRIMARY KEY (id),
  CONSTRAINT anesthesia_records_case_id_fkey FOREIGN KEY (case_id)
    REFERENCES public.theatre_cases(id) ON DELETE CASCADE
);

-- Anesthesia Chart (Live monitoring)
CREATE TABLE IF NOT EXISTS public.anesthesia_chart (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL,
  recorded_time timestamp with time zone NOT NULL,
  blood_pressure text NULL,
  pulse integer NULL,
  oxygen_saturation integer NULL,
  temperature decimal(4,1) NULL,
  respiratory_rate integer NULL,
  drugs_administered jsonb NULL, -- array of {drug_name, dosage, time_given}
  iv_fluids jsonb NULL, -- array of {fluid_type, volume, time_given}
  notes text NULL,
  emergency_flag boolean DEFAULT false,
  recorded_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT anesthesia_chart_pkey PRIMARY KEY (id),
  CONSTRAINT anesthesia_chart_case_id_fkey FOREIGN KEY (case_id)
    REFERENCES public.theatre_cases(id) ON DELETE CASCADE
);

-- Theatre Consumables Usage
CREATE TABLE IF NOT EXISTS public.theatre_consumables (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL,
  item_type text NOT NULL, -- drug, consumable, implant
  item_name text NOT NULL,
  batch_number text NULL,
  expiry_date date NULL,
  quantity_used decimal(10,2) NOT NULL,
  unit text NOT NULL,
  cost_per_unit decimal(10,2) NULL,
  total_cost decimal(10,2) NULL,
  pharmacy_stock_deducted boolean DEFAULT false,
  recorded_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT theatre_consumables_pkey PRIMARY KEY (id),
  CONSTRAINT theatre_consumables_case_id_fkey FOREIGN KEY (case_id)
    REFERENCES public.theatre_cases(id) ON DELETE CASCADE
);

-- Theatre Stock Movements (for inventory tracking)
CREATE TABLE IF NOT EXISTS public.theatre_stock_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  item_name text NOT NULL,
  movement_type text NOT NULL, -- request, approved, used, returned
  quantity decimal(10,2) NOT NULL,
  batch_number text NULL,
  expiry_date date NULL,
  case_id uuid NULL,
  requested_by uuid NOT NULL,
  approved_by uuid NULL,
  approved_at timestamp with time zone NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT theatre_stock_movements_pkey PRIMARY KEY (id),
  CONSTRAINT theatre_stock_movements_case_id_fkey FOREIGN KEY (case_id)
    REFERENCES public.theatre_cases(id) ON DELETE SET NULL
);

-- Theatre Safety Checklist
CREATE TABLE IF NOT EXISTS public.theatre_checklists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL,
  checklist_phase text NOT NULL, -- pre_op, time_out, post_op
  item_name text NOT NULL,
  is_completed boolean DEFAULT false,
  completed_by uuid NULL,
  completed_at timestamp with time zone NULL,
  notes text NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT theatre_checklists_pkey PRIMARY KEY (id),
  CONSTRAINT theatre_checklists_case_id_fkey FOREIGN KEY (case_id)
    REFERENCES public.theatre_cases(id) ON DELETE CASCADE
);

-- Recovery Notes
CREATE TABLE IF NOT EXISTS public.recovery_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL,
  recorded_time timestamp with time zone NOT NULL,
  vital_signs jsonb NULL, -- bp, pulse, temp, spo2, rr
  complications text NULL,
  medications_given jsonb NULL,
  transfer_to_ward boolean DEFAULT false,
  ward_name text NULL,
  transfer_time timestamp with time zone NULL,
  recorded_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT recovery_notes_pkey PRIMARY KEY (id),
  CONSTRAINT recovery_notes_case_id_fkey FOREIGN KEY (case_id)
    REFERENCES public.theatre_cases(id) ON DELETE CASCADE
);

-- Theatre Recovery Documentation
CREATE TABLE IF NOT EXISTS public.theatre_recovery (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  recovery_nurse uuid NOT NULL,
  time_in_recovery timestamp with time zone NOT NULL,
  time_out_recovery timestamp with time zone NULL,
  vital_signs jsonb DEFAULT '[]'::jsonb, -- Array of vital sign readings
  complications jsonb DEFAULT '[]'::jsonb, -- Array of complications
  medications_given jsonb DEFAULT '[]'::jsonb, -- Array of medications administered
  fluids_intake jsonb DEFAULT '[]'::jsonb, -- Array of fluids intake
  urine_output jsonb DEFAULT '[]'::jsonb, -- Array of urine output
  discharge_criteria jsonb NOT NULL DEFAULT '{"stable_vitals": false, "pain_controlled": false, "no_bleeding": false, "able_to_drink": false, "oriented": false}'::jsonb,
  discharge_time timestamp with time zone NULL,
  discharge_to text NULL, -- ward, icu, home, other
  notes text NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT theatre_recovery_pkey PRIMARY KEY (id),
  CONSTRAINT theatre_recovery_case_id_fkey FOREIGN KEY (case_id)
    REFERENCES public.theatre_cases(id) ON DELETE CASCADE,
  CONSTRAINT theatre_recovery_patient_id_fkey FOREIGN KEY (patient_id)
    REFERENCES public.patients(id) ON DELETE CASCADE
);

-- Theatre Bills (updated structure)
CREATE TABLE IF NOT EXISTS public.theatre_bills (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  total_amount decimal(10,2) NOT NULL DEFAULT 0,
  surgeon_fee decimal(10,2) NOT NULL DEFAULT 0,
  anesthetist_fee decimal(10,2) NOT NULL DEFAULT 0,
  theatre_charges decimal(10,2) NOT NULL DEFAULT 0,
  consumables_cost decimal(10,2) NOT NULL DEFAULT 0,
  medication_cost decimal(10,2) NOT NULL DEFAULT 0,
  insurance_coverage decimal(10,2) NULL DEFAULT 0,
  patient_payable decimal(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', -- pending, approved, paid, cancelled
  bill_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  paid_at timestamp with time zone NULL,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT theatre_bills_pkey PRIMARY KEY (id),
  CONSTRAINT theatre_bills_case_id_fkey FOREIGN KEY (case_id)
    REFERENCES public.theatre_cases(id) ON DELETE CASCADE,
  CONSTRAINT theatre_bills_patient_id_fkey FOREIGN KEY (patient_id)
    REFERENCES public.patients(id) ON DELETE CASCADE
);

-- Theatre Commissions (updated structure)
CREATE TABLE IF NOT EXISTS public.theatre_commissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL,
  doctor_name text NOT NULL,
  case_id uuid NOT NULL,
  procedure_name text NOT NULL,
  commission_amount decimal(10,2) NOT NULL,
  commission_percentage decimal(5,2) NOT NULL,
  total_fee decimal(10,2) NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending', -- pending, paid, cancelled
  commission_date date NOT NULL,
  paid_at timestamp with time zone NULL,
  payment_reference text NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT theatre_commissions_pkey PRIMARY KEY (id),
  CONSTRAINT theatre_commissions_case_id_fkey FOREIGN KEY (case_id)
    REFERENCES public.theatre_cases(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON public.staff(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_role ON public.staff(role);
CREATE INDEX IF NOT EXISTS idx_staff_department ON public.staff(department);
CREATE INDEX IF NOT EXISTS idx_staff_email ON public.staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_is_active ON public.staff(is_active);
CREATE INDEX IF NOT EXISTS idx_staff_is_available ON public.staff(is_available);

-- Function to get available staff by role and department
CREATE OR REPLACE FUNCTION get_available_staff(p_role text DEFAULT NULL, p_department text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  staff_id text,
  first_name text,
  last_name text,
  email text,
  phone text,
  role text,
  specialty text,
  department text,
  license_number text,
  experience_years integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.staff_id,
    s.first_name,
    s.last_name,
    s.email,
    s.phone,
    s.role,
    s.specialty,
    s.department,
    s.license_number,
    s.experience_years
  FROM public.staff s
  WHERE s.is_active = true
    AND s.is_available = true
    AND (p_role IS NULL OR s.role = p_role)
    AND (p_department IS NULL OR s.department = p_department)
  ORDER BY s.first_name, s.last_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Staff Permissions Table (Role-based access control)
CREATE TABLE IF NOT EXISTS public.staff_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  role text NOT NULL,
  permission text NOT NULL, -- view_patients, edit_patients, manage_staff, access_theatre, etc.
  module text NOT NULL, -- patients, theatre, pharmacy, billing, reports, admin
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT staff_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT staff_permissions_unique UNIQUE (role, permission, module)
);

-- Insert default role permissions
INSERT INTO public.staff_permissions (role, permission, module) VALUES
-- Super Admin - All permissions
('super_admin', 'manage_all', 'all'),

-- Admin permissions
('admin', 'view_all', 'all'),
('admin', 'manage_staff', 'admin'),
('admin', 'manage_departments', 'admin'),
('admin', 'view_reports', 'reports'),
('admin', 'manage_billing', 'billing'),

-- Doctor permissions
('doctor', 'view_patients', 'patients'),
('doctor', 'edit_patients', 'patients'),
('doctor', 'prescribe_medication', 'pharmacy'),
('doctor', 'order_lab_tests', 'laboratory'),
('doctor', 'access_theatre', 'theatre'),
('doctor', 'view_billing', 'billing'),

-- Surgeon specific
('surgeon', 'perform_surgery', 'theatre'),
('surgeon', 'manage_surgical_cases', 'theatre'),

-- Anesthetist specific
('anesthetist', 'manage_anesthesia', 'theatre'),
('anesthetist', 'monitor_vitals', 'theatre'),

-- Nurse permissions
('scrub_nurse', 'assist_surgery', 'theatre'),
('circulating_nurse', 'manage_theatre_supplies', 'theatre'),
('recovery_nurse', 'manage_recovery', 'theatre'),
('nurse', 'view_patients', 'patients'),
('nurse', 'record_vitals', 'patients'),
('nurse', 'administer_medication', 'pharmacy'),

-- Technician permissions
('theatre_technician', 'maintain_equipment', 'theatre'),
('technician', 'view_equipment', 'admin'),

-- Pharmacist permissions
('pharmacist', 'manage_inventory', 'pharmacy'),
('pharmacist', 'dispense_medication', 'pharmacy'),
('pharmacist', 'view_prescriptions', 'pharmacy'),

-- Lab Technician permissions
('lab_technician', 'perform_tests', 'laboratory'),
('lab_technician', 'manage_samples', 'laboratory'),

-- Receptionist permissions
('receptionist', 'register_patients', 'patients'),
('receptionist', 'schedule_appointments', 'patients'),
('receptionist', 'view_basic_info', 'patients');

-- Index for staff permissions
CREATE INDEX IF NOT EXISTS idx_staff_permissions_role ON public.staff_permissions(role);
CREATE INDEX IF NOT EXISTS idx_staff_permissions_module ON public.staff_permissions(module);

-- Function to check if staff has permission
CREATE OR REPLACE FUNCTION has_staff_permission(p_staff_id uuid, p_permission text, p_module text)
RETURNS boolean AS $$
DECLARE
  staff_role text;
BEGIN
  -- Get staff role
  SELECT role INTO staff_role
  FROM public.staff
  WHERE id = p_staff_id AND is_active = true;

  IF staff_role IS NULL THEN
    RETURN false;
  END IF;

  -- Check if role has the permission
  RETURN EXISTS (
    SELECT 1
    FROM public.staff_permissions
    WHERE role = staff_role
      AND (permission = p_permission OR permission = 'manage_all')
      AND (module = p_module OR module = 'all')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE INDEX IF NOT EXISTS idx_theatre_bookings_patient_id ON public.theatre_bookings(patient_id);
CREATE INDEX IF NOT EXISTS idx_theatre_bookings_preferred_date ON public.theatre_bookings(preferred_date);
CREATE INDEX IF NOT EXISTS idx_theatre_cases_booking_id ON public.theatre_cases(booking_id);
CREATE INDEX IF NOT EXISTS idx_theatre_cases_status ON public.theatre_cases(status);
CREATE INDEX IF NOT EXISTS idx_theatre_team_case_id ON public.theatre_team(case_id);
CREATE INDEX IF NOT EXISTS idx_surgery_notes_case_id ON public.surgery_notes(case_id);
CREATE INDEX IF NOT EXISTS idx_anesthesia_records_case_id ON public.anesthesia_records(case_id);
CREATE INDEX IF NOT EXISTS idx_anesthesia_chart_case_id ON public.anesthesia_chart(case_id);
CREATE INDEX IF NOT EXISTS idx_theatre_consumables_case_id ON public.theatre_consumables(case_id);
CREATE INDEX IF NOT EXISTS idx_theatre_checklists_case_id ON public.theatre_checklists(case_id);
CREATE INDEX IF NOT EXISTS idx_recovery_notes_case_id ON public.recovery_notes(case_id);
CREATE INDEX IF NOT EXISTS idx_theatre_recovery_case_id ON public.theatre_recovery(case_id);
CREATE INDEX IF NOT EXISTS idx_theatre_bills_case_id ON public.theatre_bills(case_id);
CREATE INDEX IF NOT EXISTS idx_theatre_bills_status ON public.theatre_bills(status);
CREATE INDEX IF NOT EXISTS idx_theatre_commissions_doctor_id ON public.theatre_commissions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_theatre_commissions_payment_status ON public.theatre_commissions(payment_status);
CREATE INDEX IF NOT EXISTS idx_theatre_commissions_commission_date ON public.theatre_commissions(commission_date);

-- ===================================================================
-- LABORATORY MODULE - Detailed Lab Schema Integration
-- ===================================================================

-- Lab Requests Table (Test Orders from OPD/IPD)
DROP TABLE IF EXISTS public.lab_requests CASCADE;
CREATE TABLE IF NOT EXISTS public.lab_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL,
  test_id uuid NOT NULL,
  lab_amount decimal(10,2) NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  department text NULL, -- Department that ordered the test
  urgency text NOT NULL DEFAULT 'routine' CHECK (urgency IN ('routine', 'urgent', 'emergency')),
  results jsonb NULL, -- Test results stored here
  completed_at timestamp with time zone NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lab_requests_pkey PRIMARY KEY (id),
  CONSTRAINT lab_requests_visit_id_fkey FOREIGN KEY (visit_id)
    REFERENCES public.visits(id) ON DELETE CASCADE,
  CONSTRAINT lab_requests_test_id_fkey FOREIGN KEY (test_id)
    REFERENCES public.lab_test_master(id) ON DELETE CASCADE
);

-- Lab Test Master Table (Test Catalog)
DROP TABLE IF EXISTS public.lab_test_master CASCADE;
CREATE TABLE IF NOT EXISTS public.lab_test_master (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  test_name text NOT NULL,
  test_code text NOT NULL UNIQUE, -- Unique test code identifier
  category text NOT NULL, -- Hematology, Clinical Chemistry, etc.
  sample_type text NULL, -- Blood, Urine, Stool, etc.
  turnaround_time_minutes integer NULL, -- Expected completion time
  price decimal(10,2) NULL, -- Test price
  cost decimal(10,2) NULL, -- Internal cost
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lab_test_master_pkey PRIMARY KEY (id),
  CONSTRAINT lab_test_master_test_code_key UNIQUE (test_code)
);

-- Lab Results Table
CREATE TABLE IF NOT EXISTS public.lab_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL,
  results jsonb NULL, -- JSON array of test parameters and results
  status text NOT NULL DEFAULT 'pending_verification' CHECK (status IN ('pending_entry', 'pending_verification', 'verified', 'released', 'cancelled')),
  technician_id uuid NULL REFERENCES public.staff(id),
  entered_at timestamp with time zone DEFAULT now(),
  verified_by uuid NULL REFERENCES public.staff(id),
  verified_at timestamp with time zone NULL,
  released_at timestamp with time zone NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lab_results_pkey PRIMARY KEY (id),
  CONSTRAINT lab_results_request_id_fkey FOREIGN KEY (request_id)
    REFERENCES public.lab_requests(id) ON DELETE CASCADE
);

-- Lab Result Templates Table
CREATE TABLE IF NOT EXISTS public.lab_result_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL,
  test_name text NOT NULL,
  parameters jsonb NOT NULL, -- JSON array of parameter definitions
  unit text NULL,
  reference_range text NULL,
  critical_low decimal(10,2) NULL,
  critical_high decimal(10,2) NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lab_result_templates_pkey PRIMARY KEY (id),
  CONSTRAINT lab_result_templates_test_id_fkey FOREIGN KEY (test_id)
    REFERENCES public.lab_test_master(id) ON DELETE CASCADE
);

-- Lab Quality Control Table
CREATE TABLE IF NOT EXISTS public.lab_qc (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL,
  qc_date date NOT NULL,
  qc_level text NOT NULL, -- 1, 2, 3 (Low, Normal, High)
  expected_value decimal(10,2) NOT NULL,
  obtained_value decimal(10,2) NOT NULL,
  variance decimal(5,2) NULL, -- percentage variance
  status text NOT NULL DEFAULT 'passed' CHECK (status IN ('passed', 'failed', 'repeated')),
  remarks text NULL,
  checked_by uuid NULL REFERENCES public.staff(id),
  checked_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lab_qc_pkey PRIMARY KEY (id),
  CONSTRAINT lab_qc_test_id_fkey FOREIGN KEY (test_id)
    REFERENCES public.lab_test_master(id) ON DELETE CASCADE
);

-- Lab Reagent Management
CREATE TABLE IF NOT EXISTS public.lab_reagents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  test_id uuid NULL REFERENCES public.lab_test_master(id),
  reagent_name text NOT NULL,
  manufacturer text NOT NULL,
  batch_number text NOT NULL UNIQUE,
  lot_number text NULL,
  expiry_date date NOT NULL,
  quantity_received decimal(10,2) NOT NULL,
  quantity_used decimal(10,2) NOT NULL DEFAULT 0,
  storage_condition text NULL, -- 2-8°C, Room Temp, -20°C, etc.
  opened_date date NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'low_stock', 'expired', 'damaged', 'used_up')),
  supplier text NULL,
  cost decimal(10,2) NULL,
  received_date date NOT NULL,
  received_by uuid NULL REFERENCES public.staff(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lab_reagents_pkey PRIMARY KEY (id)
);

-- Lab Equipment Maintenance
CREATE TABLE IF NOT EXISTS public.lab_equipment (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  equipment_name text NOT NULL,
  equipment_code text NOT NULL UNIQUE,
  manufacturer text NOT NULL,
  model_number text NOT NULL,
  serial_number text NULL,
  purchase_date date NOT NULL,
  installation_date date NULL,
  warranty_expiry date NULL,
  location text NOT NULL,
  status text NOT NULL DEFAULT 'operational' CHECK (status IN ('operational', 'maintenance', 'out_of_service', 'decommissioned')),
  last_calibration_date date NULL,
  calibration_due_date date NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lab_equipment_pkey PRIMARY KEY (id)
);

-- Equipment Maintenance Log
CREATE TABLE IF NOT EXISTS public.lab_equipment_maintenance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL,
  maintenance_type text NOT NULL CHECK (maintenance_type IN ('preventive', 'corrective', 'calibration', 'cleaning')),
  maintenance_date date NOT NULL,
  performed_by uuid NOT NULL REFERENCES public.staff(id),
  findings text NULL,
  actions_taken text NULL,
  parts_replaced text NULL,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed')),
  next_maintenance_date date NULL,
  notes text NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lab_equipment_maintenance_pkey PRIMARY KEY (id),
  CONSTRAINT lab_equipment_maintenance_equipment_id_fkey FOREIGN KEY (equipment_id)
    REFERENCES public.lab_equipment(id) ON DELETE CASCADE
);

-- Lab Results History/Audit Trail
CREATE TABLE IF NOT EXISTS public.lab_results_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  result_id uuid NOT NULL,
  previous_values jsonb NULL,
  new_values jsonb NULL,
  changed_by uuid NULL REFERENCES public.staff(id),
  change_reason text NULL,
  changed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lab_results_audit_pkey PRIMARY KEY (id),
  CONSTRAINT lab_results_audit_result_id_fkey FOREIGN KEY (result_id)
    REFERENCES public.lab_results(id) ON DELETE CASCADE
);

-- Lab indexes
CREATE INDEX IF NOT EXISTS idx_lab_requests_visit_id ON public.lab_requests(visit_id);
CREATE INDEX IF NOT EXISTS idx_lab_requests_test_id ON public.lab_requests(test_id);
CREATE INDEX IF NOT EXISTS idx_lab_requests_status ON public.lab_requests(status);
CREATE INDEX IF NOT EXISTS idx_lab_requests_payment_status ON public.lab_requests(payment_status);
CREATE INDEX IF NOT EXISTS idx_lab_results_request_id ON public.lab_results(request_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_status ON public.lab_results(status);
CREATE INDEX IF NOT EXISTS idx_lab_results_technician_id ON public.lab_results(technician_id);
CREATE INDEX IF NOT EXISTS idx_lab_result_templates_test_id ON public.lab_result_templates(test_id);
CREATE INDEX IF NOT EXISTS idx_lab_qc_test_id ON public.lab_qc(test_id);
CREATE INDEX IF NOT EXISTS idx_lab_qc_date ON public.lab_qc(qc_date);
CREATE INDEX IF NOT EXISTS idx_lab_reagents_test_id ON public.lab_reagents(test_id);
CREATE INDEX IF NOT EXISTS idx_lab_reagents_expiry ON public.lab_reagents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_lab_reagents_status ON public.lab_reagents(status);
CREATE INDEX IF NOT EXISTS idx_lab_equipment_status ON public.lab_equipment(status);
CREATE INDEX IF NOT EXISTS idx_lab_equipment_location ON public.lab_equipment(location);
CREATE INDEX IF NOT EXISTS idx_lab_maintenance_equipment_id ON public.lab_equipment_maintenance(equipment_id);
CREATE INDEX IF NOT EXISTS idx_lab_maintenance_date ON public.lab_equipment_maintenance(maintenance_date);

-- Insert sample data for testing
-- Note: Replace with actual UUIDs from your system

-- Sample lab technicians (additional staff)
INSERT INTO public.staff (staff_id, first_name, last_name, email, phone, role, specialty, department, license_number, license_expiry, qualifications, experience_years, hire_date, salary, is_active, is_available) VALUES
('LAB001', 'Michael', 'Davis', 'michael.davis@lifepoint.com', '+254700000006', 'lab_technician', 'Clinical Pathology', 'Laboratory', 'LIC006', '2026-03-15', '["Diploma Lab Science", "EXLP Certification"]', 7, '2017-02-01', 140000.00, true, true)
ON CONFLICT (staff_id) DO NOTHING;
INSERT INTO public.staff (staff_id, first_name, last_name, email, phone, role, specialty, department, license_number, license_expiry, qualifications, experience_years, hire_date, salary, emergency_contact_name, emergency_contact_phone, is_active, is_available) VALUES
('DOC001', 'John', 'Smith', 'john.smith@lifepoint.com', '+254700000001', 'surgeon', 'General Surgery', 'Theatre', 'LIC001', '2026-12-31', '["MBBS", "MS General Surgery", "FACS"]', 15, '2010-01-15', 500000.00, 'Jane Smith', '+254700000011', true, true),
('DOC002', 'Jane', 'Doe', 'jane.doe@lifepoint.com', '+254700000002', 'anesthetist', 'Anesthesiology', 'Theatre', 'LIC002', '2026-06-30', '["MBBS", "DA Anesthesia", "FICA"]', 12, '2012-03-20', 400000.00, 'John Doe', '+254700000012', true, true),
('NUR001', 'Mary', 'Johnson', 'mary.johnson@lifepoint.com', '+254700000003', 'scrub_nurse', 'Theatre Nursing', 'Theatre', 'LIC003', '2025-08-15', '["RN", "OT Certification", "BSc Nursing"]', 8, '2016-05-10', 150000.00, 'Peter Johnson', '+254700000013', true, true),
('NUR002', 'Sarah', 'Williams', 'sarah.williams@lifepoint.com', '+254700000004', 'circulating_nurse', 'Theatre Nursing', 'Theatre', 'LIC004', '2025-11-20', '["RN", "OT Certification", "ACLS"]', 10, '2014-07-01', 160000.00, 'Mike Williams', '+254700000014', true, true),
('TECH001', 'David', 'Brown', 'david.brown@lifepoint.com', '+254700000005', 'theatre_technician', 'Biomedical Engineering', 'Theatre', 'LIC005', '2027-01-10', '["Diploma Biomedical", "Equipment Maintenance Cert"]', 6, '2018-09-15', 120000.00, 'Lisa Brown', '+254700000015', true, true);

-- Sample pharmacy stock data
INSERT INTO public.pharmacy_stock (item_name, generic_name, category, batch_number, expiry_date, current_stock, unit, unit_cost, selling_price, supplier, location, min_stock_level, requires_prescription) VALUES
('Surgical Gloves (Size 7)', 'Latex Gloves', 'consumable', 'BATCH001', '2025-12-31', 500.00, 'pairs', 50.00, 75.00, 'MedSupplies Ltd', 'Theatre Store', 100.00, false),
('Cefazolin 1g Injection', 'Cefazolin', 'drug', 'BATCH002', '2024-06-30', 200.00, 'vials', 150.00, 200.00, 'PharmaCorp', 'Pharmacy', 50.00, true),
('Surgical Suture 3-0', 'Vicryl Suture', 'consumable', 'BATCH003', '2025-08-15', 100.00, 'packets', 500.00, 750.00, 'MedSupplies Ltd', 'Theatre Store', 20.00, false),
('Propofol 10mg/ml', 'Propofol', 'drug', 'BATCH004', '2024-12-31', 50.00, 'vials', 2000.00, 2500.00, 'PharmaCorp', 'Theatre Fridge', 10.00, true);

-- Sample theatre recovery record
INSERT INTO public.theatre_recovery (case_id, patient_id, recovery_nurse, time_in_recovery, notes) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', NOW(), 'Sample recovery record');

-- Sample theatre bill
INSERT INTO public.theatre_bills (case_id, patient_id, total_amount, surgeon_fee, anesthetist_fee, theatre_charges, consumables_cost, patient_payable, status, bill_items) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 150000.00, 100000.00, 25000.00, 20000.00, 5000.00, 150000.00, 'pending', '[{"description": "Appendectomy - Surgeon Fee", "quantity": 1, "unit_price": 100000, "total": 100000, "category": "surgery"}]');

-- Sample theatre commission
INSERT INTO public.theatre_commissions (doctor_id, doctor_name, case_id, procedure_name, commission_amount, commission_percentage, total_fee, payment_status, commission_date) VALUES
('00000000-0000-0000-0000-000000000001', 'Dr. John Smith', '00000000-0000-0000-0000-000000000001', 'Appendectomy', 30000.00, 30.00, 100000.00, 'pending', CURRENT_DATE);