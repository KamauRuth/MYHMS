-- ============================================
-- BILLING INTEGRATION SCHEMA
-- Adds billing fields to all department tables
-- ============================================

-- ============================================
-- 1. VISITS/CONSULTATIONS - OPD BILLING
-- ============================================
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS invoice_id uuid NULL;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS consultation_fee numeric DEFAULT 0;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS billed boolean DEFAULT false;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS billing_date timestamp with time zone NULL;
ALTER TABLE public.visits ADD CONSTRAINT visits_invoice_fk FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;

-- ============================================
-- 2. LAB TESTS - LAB DEPARTMENT BILLING
-- ============================================
ALTER TABLE public.labs ADD COLUMN IF NOT EXISTS invoice_id uuid NULL;
ALTER TABLE public.labs ADD COLUMN IF NOT EXISTS total_cost numeric DEFAULT 0;
ALTER TABLE public.labs ADD COLUMN IF NOT EXISTS billed boolean DEFAULT false;
ALTER TABLE public.labs ADD COLUMN IF NOT EXISTS billing_date timestamp with time zone NULL;
ALTER TABLE public.labs ADD CONSTRAINT labs_invoice_fk FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;

-- ============================================
-- 3. LAB RESULTS - INDIVIDUAL TEST PRICING
-- ============================================
ALTER TABLE IF EXISTS public.lab_results ADD COLUMN IF NOT EXISTS test_price numeric NULL;
ALTER TABLE IF EXISTS public.lab_results ADD COLUMN IF NOT EXISTS test_code text NULL;

-- ============================================
-- 4. ADMISSIONS - IPD BILLING
-- ============================================
ALTER TABLE IF EXISTS public.admissions ADD COLUMN IF NOT EXISTS invoice_id uuid NULL;
ALTER TABLE IF EXISTS public.admissions ADD COLUMN IF NOT EXISTS bed_charge_daily numeric DEFAULT 0;
ALTER TABLE IF EXISTS public.admissions ADD COLUMN IF NOT EXISTS total_admission_cost numeric DEFAULT 0;
ALTER TABLE IF EXISTS public.admissions ADD COLUMN IF NOT EXISTS billed boolean DEFAULT false;
ALTER TABLE IF EXISTS public.admissions ADD COLUMN IF NOT EXISTS billing_date timestamp with time zone NULL;
ALTER TABLE IF EXISTS public.admissions ADD CONSTRAINT admissions_invoice_fk FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;

-- ============================================
-- 5. INPATIENT ADMISSIONS - IPD BILLING (NextJS version)
-- ============================================
ALTER TABLE IF EXISTS public.inpatient_admissions ADD COLUMN IF NOT EXISTS invoice_id uuid NULL;
ALTER TABLE IF EXISTS public.inpatient_admissions ADD COLUMN IF NOT EXISTS bed_charge_daily numeric DEFAULT 0;
ALTER TABLE IF EXISTS public.inpatient_admissions ADD COLUMN IF NOT EXISTS total_admission_cost numeric DEFAULT 0;
ALTER TABLE IF EXISTS public.inpatient_admissions ADD COLUMN IF NOT EXISTS billed boolean DEFAULT false;
ALTER TABLE IF EXISTS public.inpatient_admissions ADD COLUMN IF NOT EXISTS billing_date timestamp with time zone NULL;
ALTER TABLE IF EXISTS public.inpatient_admissions ADD CONSTRAINT inpatient_admissions_invoice_fk FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;

-- ============================================
-- 6. MATERNITY - MATERNITY DEPARTMENT BILLING
-- ============================================
ALTER TABLE IF EXISTS public.maternity ADD COLUMN IF NOT EXISTS invoice_id uuid NULL;
ALTER TABLE IF EXISTS public.maternity ADD COLUMN IF NOT EXISTS service_charge numeric DEFAULT 0;
ALTER TABLE IF EXISTS public.maternity ADD COLUMN IF NOT EXISTS total_maternity_cost numeric DEFAULT 0;
ALTER TABLE IF EXISTS public.maternity ADD COLUMN IF NOT EXISTS billed boolean DEFAULT false;
ALTER TABLE IF EXISTS public.maternity ADD COLUMN IF NOT EXISTS billing_date timestamp with time zone NULL;
ALTER TABLE IF EXISTS public.maternity ADD CONSTRAINT maternity_invoice_fk FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;

-- ============================================
-- 7. PRESCRIPTIONS - PHARMACY BILLING
-- ============================================
-- Already has partial billing - ensure references are correct
ALTER TABLE IF EXISTS public.prescriptions ADD COLUMN IF NOT EXISTS billed boolean DEFAULT false;
ALTER TABLE IF EXISTS public.prescriptions ADD COLUMN IF NOT EXISTS invoice_id uuid NULL;
ALTER TABLE IF EXISTS public.prescriptions ADD CONSTRAINT prescriptions_invoice_fk FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;

-- ============================================
-- 8. ADDITIONAL BILLING TABLES - SERVICE MASTERS
-- ============================================

-- Service Master for OPD
CREATE TABLE IF NOT EXISTS public.opd_services (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  service_name text NOT NULL UNIQUE,
  service_code text NOT NULL UNIQUE,
  consultation_fee numeric NOT NULL,
  description text NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT opd_services_pkey PRIMARY KEY (id)
);

-- Service Master for Lab Tests
CREATE TABLE IF NOT EXISTS public.lab_test_pricing (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  test_name text NOT NULL,
  test_code text NOT NULL UNIQUE,
  category text NOT NULL,
  selling_price numeric NOT NULL,
  cost_price numeric NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lab_test_pricing_pkey PRIMARY KEY (id)
);

-- Service Master for IPD (Bed Types)
CREATE TABLE IF NOT EXISTS public.bed_charge_master (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bed_type text NOT NULL UNIQUE,
  daily_charge numeric NOT NULL,
  description text NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bed_charge_master_pkey PRIMARY KEY (id)
);

-- Service Master for Maternity
CREATE TABLE IF NOT EXISTS public.maternity_services (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  service_name text NOT NULL UNIQUE,
  service_code text NOT NULL UNIQUE,
  service_fee numeric NOT NULL,
  description text NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT maternity_services_pkey PRIMARY KEY (id)
);

-- ============================================
-- 9. INVOICE LINE ITEM TYPES (for categorization)
-- ============================================
-- Items should be categorized by department
-- item_type can be: 'opd_consultation', 'lab_test', 'ipd_bed', 'maternity_service', 'pharmacy_drug', 'theatre_procedure'

-- ============================================
-- 10. BILLING CONFIGURATION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.billing_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  config_key text NOT NULL UNIQUE,
  config_value text NOT NULL,
  config_type text DEFAULT 'text', -- text, numeric, boolean
  description text NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT billing_config_pkey PRIMARY KEY (id)
);

-- Insert default configuration
INSERT INTO public.billing_config (config_key, config_value, config_type, description) VALUES
('auto_inv_prefix', 'LPH-INV', 'text', 'Invoice number prefix'),
('auto_inv_start_number', '1000', 'numeric', 'Starting invoice number'),
('vat_percentage', '0', 'numeric', 'VAT percentage (0 if not applicable)'),
('discount_max_percentage', '10', 'numeric', 'Maximum discount percentage allowed'),
('invoice_auto_generate', 'true', 'boolean', 'Auto-generate invoice on service completion')
ON CONFLICT (config_key) DO NOTHING;

-- ============================================
-- 11. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_visits_invoice ON public.visits(invoice_id);
CREATE INDEX IF NOT EXISTS idx_visits_billed ON public.visits(billed);
CREATE INDEX IF NOT EXISTS idx_labs_invoice ON public.labs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_labs_billed ON public.labs(billed);
CREATE INDEX IF NOT EXISTS idx_admissions_invoice ON public.admissions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_admissions_billed ON public.admissions(billed);
CREATE INDEX IF NOT EXISTS idx_maternity_invoice ON public.maternity(invoice_id);
CREATE INDEX IF NOT EXISTS idx_maternity_billed ON public.maternity(billed);
CREATE INDEX IF NOT EXISTS idx_invoices_patient_visit ON public.invoices(patient_id, visit_id);

-- ============================================
-- 12. DEFAULT SERVICE DATA
-- ============================================

-- Default OPD Services
INSERT INTO public.opd_services (service_name, service_code, consultation_fee, description) VALUES
('General Consultation', 'OPD-001', 500, 'Standard OPD consultation'),
('Specialist Consultation', 'OPD-002', 1500, 'Specialist doctor consultation'),
('Follow-up Consultation', 'OPD-003', 300, 'Follow-up appointment')
ON CONFLICT (service_code) DO NOTHING;

-- Default Bed Charges
INSERT INTO public.bed_charge_master (bed_type, daily_charge, description) VALUES
('General Ward', 5000, 'Standard general ward bed'),
('Semi-Private', 10000, 'Semi-private room'),
('Private', 20000, 'Private room'),
('ICU', 50000, 'Intensive Care Unit'),
('HDU', 30000, 'High Dependency Unit')
ON CONFLICT (bed_type) DO NOTHING;

-- Default Maternity Services
INSERT INTO public.maternity_services (service_name, service_code, service_fee, description) VALUES
('Normal Delivery', 'MAT-001', 15000, 'Uncomplicated vaginal delivery'),
('Caesarean Section', 'MAT-002', 35000, 'C-section delivery'),
('Antenatal Care', 'MAT-003', 1000, 'Single ANC visit'),
('Postnatal Care', 'MAT-004', 2000, 'PNC visit'),
('Delivery Package', 'MAT-005', 50000, 'Full maternity package (ANC + Delivery + PNC)')
ON CONFLICT (service_code) DO NOTHING;
