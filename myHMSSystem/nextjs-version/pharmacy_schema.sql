-- PHARMACY MODULE - COMPREHENSIVE DATABASE SCHEMA FOR LIFEPOINT HOSPITAL
-- This schema integrates with OPD, IPD, Theatre, Lab, Maternity, and CWC departments

-- ============================================
-- 1. DRUG MASTER TABLE
-- ============================================
DROP TABLE IF EXISTS public.drugs CASCADE;
CREATE TABLE IF NOT EXISTS public.drugs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  drug_name text NOT NULL,
  generic_name text NOT NULL,
  brand_name text NULL,
  category text NOT NULL CHECK (category IN ('antibiotic', 'analgesic', 'anesthetic', 'vaccine', 'iv_fluid', 'consumable', 'reagent', 'other')),
  strength text NULL, -- e.g., "500mg", "10%"
  unit_of_measure text NOT NULL DEFAULT 'pieces', -- pieces, tablets, ml, grams, syringes, etc.
  requires_prescription boolean DEFAULT true,
  controlled_substance boolean DEFAULT false,
  shelf_life_days integer NULL,
  reorder_level integer NOT NULL DEFAULT 50,
  reorder_quantity integer NOT NULL DEFAULT 100,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT drugs_pkey PRIMARY KEY (id),
  CONSTRAINT drugs_drug_name_generic_unique UNIQUE (drug_name, generic_name)
);

-- ============================================
-- 2. SUPPLIERS TABLE
-- ============================================
DROP TABLE IF EXISTS public.suppliers CASCADE;
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  supplier_name text NOT NULL UNIQUE,
  supplier_code text NOT NULL UNIQUE,
  contact_person text NULL,
  phone text NOT NULL,
  email text NULL,
  address text NULL,
  city text NULL,
  payment_terms text DEFAULT 'net_30', -- net_30, net_60, COD, etc.
  credit_limit decimal(15,2) NULL,
  outstanding_balance decimal(15,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  rating decimal(3,2) NULL, -- 1-5 stars
  last_order_date timestamp with time zone NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT suppliers_pkey PRIMARY KEY (id)
);

-- ============================================
-- 3. DRUG BATCHES TABLE (Batch tracking for expiry)
-- ============================================
DROP TABLE IF EXISTS public.drug_batches CASCADE;
CREATE TABLE IF NOT EXISTS public.drug_batches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  drug_id uuid NOT NULL,
  batch_number text NOT NULL,
  supplier_id uuid NOT NULL,
  purchase_order_id text NULL,
  quantity_received integer NOT NULL,
  quantity_in_stock integer NOT NULL DEFAULT 0,
  unit_cost decimal(10,2) NOT NULL,
  selling_price decimal(10,2) NOT NULL,
  markup_percentage decimal(5,2) DEFAULT 30, -- Default 30% markup
  received_date date NOT NULL,
  expiry_date date NOT NULL,
  storage_location text NULL,
  status text NOT NULL DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'partials', 'low_stock', 'expired', 'recalled')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT drug_batches_pkey PRIMARY KEY (id),
  CONSTRAINT drug_batches_drug_id_fkey FOREIGN KEY (drug_id)
    REFERENCES public.drugs(id) ON DELETE CASCADE,
  CONSTRAINT drug_batches_supplier_id_fkey FOREIGN KEY (supplier_id)
    REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  CONSTRAINT drug_batches_batch_unique UNIQUE (batch_number, drug_id)
);

-- ============================================
-- 4. STOCK MOVEMENTS TABLE (Audit trail for all stock changes)
-- ============================================
DROP TABLE IF EXISTS public.stock_movements CASCADE;
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL,
  movement_type text NOT NULL CHECK (movement_type IN ('stock_in', 'dispense_opd', 'dispense_ipd', 'dispense_theatre', 'dispense_lab', 'dispense_maternity', 'dispense_cwc', 'internal_wastage', 'expiry_loss', 'adjustment', 'return')),
  quantity integer NOT NULL,
  moved_by uuid NOT NULL,
  movement_date timestamp with time zone DEFAULT now(),
  department text NULL, -- OPD, IPD, Theatre, Lab, Maternity, CWC
  reference_id text NULL, -- prescription_id, visit_id, surgery_id, lab_request_id, etc.
  related_patient_id uuid NULL,
  cost_per_unit decimal(10,2) NULL,
  adjustment_reason text NULL, -- For adjustments only
  notes text NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT stock_movements_pkey PRIMARY KEY (id),
  CONSTRAINT stock_movements_batch_id_fkey FOREIGN KEY (batch_id)
    REFERENCES public.drug_batches(id) ON DELETE CASCADE
);

-- ============================================
-- 5. PRESCRIPTIONS TABLE (Links to all departments)
-- ============================================
DROP TABLE IF EXISTS public.prescriptions CASCADE;
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  prescription_number text NOT NULL UNIQUE,
  patient_id uuid NOT NULL,
  visit_id uuid NOT NULL,
  prescribed_by uuid NOT NULL, -- Doctor/Clinician
  department text NOT NULL CHECK (department IN ('opd', 'ipd', 'theatre', 'lab', 'maternity', 'cwc', 'emergency')),
  source_type text NOT NULL CHECK (source_type IN ('opd_visit', 'ipd_admission', 'theatre_case', 'lab_request', 'maternity', 'cwc_visit')),
  source_id uuid NOT NULL, -- ID of the source (visit_id, admission_id, case_id, etc.)
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'dispensed', 'partial', 'cancelled', 'expired')),
  prescribed_at timestamp with time zone DEFAULT now(),
  dispensed_at timestamp with time zone NULL,
  expires_at timestamp with time zone NULL DEFAULT (now() + interval '30 days'),
  notes text NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT prescriptions_pkey PRIMARY KEY (id)
);

-- ============================================
-- 6. PRESCRIPTION ITEMS TABLE
-- ============================================
DROP TABLE IF EXISTS public.prescription_items CASCADE;
CREATE TABLE IF NOT EXISTS public.prescription_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL,
  drug_id uuid NOT NULL,
  quantity_prescribed integer NOT NULL,
  quantity_dispensed integer DEFAULT 0,
  frequency text NULL, -- OD, BD, TDS, QID, etc.
  duration_days integer NULL,
  route text NULL, -- oral, iv, im, sc, topical, etc.
  special_instructions text NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'dispensed', 'partial', 'cancelled')),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT prescription_items_pkey PRIMARY KEY (id),
  CONSTRAINT prescription_items_prescription_id_fkey FOREIGN KEY (prescription_id)
    REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  CONSTRAINT prescription_items_drug_id_fkey FOREIGN KEY (drug_id)
    REFERENCES public.drugs(id) ON DELETE RESTRICT
);

-- ============================================
-- 7. PHARMACY DISPENSING RECORDS
-- ============================================
DROP TABLE IF EXISTS public.pharmacy_dispensing CASCADE;
CREATE TABLE IF NOT EXISTS public.pharmacy_dispensing (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dispensing_number text NOT NULL UNIQUE,
  prescription_item_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  quantity_dispensed integer NOT NULL,
  dispensed_by uuid NOT NULL, -- Pharmacist/Assistant
  dispensed_at timestamp with time zone DEFAULT now(),
  cost_price_total decimal(15,2) NOT NULL,
  selling_price_total decimal(15,2) NOT NULL,
  profit decimal(15,2) GENERATED ALWAYS AS (selling_price_total - cost_price_total) STORED,
  invoice_number text NULL,
  payment_received boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pharmacy_dispensing_pkey PRIMARY KEY (id),
  CONSTRAINT pharmacy_dispensing_prescription_item_id_fkey FOREIGN KEY (prescription_item_id)
    REFERENCES public.prescription_items(id) ON DELETE RESTRICT,
  CONSTRAINT pharmacy_dispensing_batch_id_fkey FOREIGN KEY (batch_id)
    REFERENCES public.drug_batches(id) ON DELETE RESTRICT
);

-- ============================================
-- 8. DEPARTMENT STOCK REQUESTS
-- ============================================
DROP TABLE IF EXISTS public.department_stock_requests CASCADE;
CREATE TABLE IF NOT EXISTS public.department_stock_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  request_number text NOT NULL UNIQUE,
  requesting_department text NOT NULL CHECK (requesting_department IN ('opd', 'ipd', 'theatre', 'lab', 'maternity', 'cwc', 'nursing')),
  requested_by uuid NOT NULL,
  request_date timestamp with time zone DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'issued', 'cancelled')),
  approval_by uuid NULL,
  approval_date timestamp with time zone NULL,
  reason_for_rejection text NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT department_stock_requests_pkey PRIMARY KEY (id)
);

-- ============================================
-- 9. DEPARTMENT STOCK REQUEST ITEMS
-- ============================================
DROP TABLE IF EXISTS public.department_stock_request_items CASCADE;
CREATE TABLE IF NOT EXISTS public.department_stock_request_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL,
  drug_id uuid NOT NULL,
  quantity_requested integer NOT NULL,
  quantity_issued integer DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'issued', 'partial', 'rejected')),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT department_stock_request_items_pkey PRIMARY KEY (id),
  CONSTRAINT department_stock_request_items_request_id_fkey FOREIGN KEY (request_id)
    REFERENCES public.department_stock_requests(id) ON DELETE CASCADE,
  CONSTRAINT department_stock_request_items_drug_id_fkey FOREIGN KEY (drug_id)
    REFERENCES public.drugs(id) ON DELETE RESTRICT
);

-- ============================================
-- 10. EXPIRY ALERTS
-- ============================================
DROP TABLE IF EXISTS public.expiry_alerts CASCADE;
CREATE TABLE IF NOT EXISTS public.expiry_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL,
  alert_type text NOT NULL CHECK (alert_type IN ('90_days_before', '30_days_before', 'expired', 'near_minimum')),
  alert_date timestamp with time zone DEFAULT now(),
  acknowledged boolean DEFAULT false,
  acknowledged_by uuid NULL,
  acknowledged_at timestamp with time zone NULL,
  action_taken text NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT expiry_alerts_pkey PRIMARY KEY (id),
  CONSTRAINT expiry_alerts_batch_id_fkey FOREIGN KEY (batch_id)
    REFERENCES public.drug_batches(id) ON DELETE CASCADE
);

-- ============================================
-- 11. PURCHASE ORDERS
-- ============================================
DROP TABLE IF EXISTS public.purchase_orders CASCADE;
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  purchase_order_number text NOT NULL UNIQUE,
  supplier_id uuid NOT NULL,
  ordered_by uuid NOT NULL,
  order_date date NOT NULL,
  expected_delivery_date date NOT NULL,
  delivery_date date NULL,
  total_amount decimal(15,2) NOT NULL,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded')),
  amount_paid decimal(15,2) DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'ordered', 'received', 'cancelled')),
  approved_by uuid NULL,
  notes text NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT purchase_orders_pkey PRIMARY KEY (id),
  CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id)
    REFERENCES public.suppliers(id) ON DELETE RESTRICT
);

-- ============================================
-- 12. PURCHASE ORDER ITEMS
-- ============================================
DROP TABLE IF EXISTS public.purchase_order_items CASCADE;
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL,
  drug_id uuid NOT NULL,
  quantity_ordered integer NOT NULL,
  quantity_received integer DEFAULT 0,
  unit_price decimal(10,2) NOT NULL,
  total_price decimal(15,2) GENERATED ALWAYS AS (quantity_ordered * unit_price) STORED,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'received', 'cancelled')),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT purchase_order_items_pkey PRIMARY KEY (id),
  CONSTRAINT purchase_order_items_purchase_order_id_fkey FOREIGN KEY (purchase_order_id)
    REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  CONSTRAINT purchase_order_items_drug_id_fkey FOREIGN KEY (drug_id)
    REFERENCES public.drugs(id) ON DELETE RESTRICT
);

-- ============================================
-- 13. PHYSICAL STOCK RECONCILIATION
-- ============================================
DROP TABLE IF EXISTS public.stock_reconciliation CASCADE;
CREATE TABLE IF NOT EXISTS public.stock_reconciliation (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reconciliation_number text NOT NULL UNIQUE,
  reconciliation_date date NOT NULL,
  performed_by uuid NOT NULL,
  approved_by uuid NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'discrepancy_flagged', 'resolved')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT stock_reconciliation_pkey PRIMARY KEY (id)
);

-- ============================================
-- 14. STOCK RECONCILIATION ITEMS
-- ============================================
DROP TABLE IF EXISTS public.stock_reconciliation_items CASCADE;
CREATE TABLE IF NOT EXISTS public.stock_reconciliation_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reconciliation_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  system_quantity integer NOT NULL,
  physical_quantity integer NOT NULL,
  variance integer GENERATED ALWAYS AS (physical_quantity - system_quantity) STORED,
  variance_reason text NULL,
  adjustment_approved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT stock_reconciliation_items_pkey PRIMARY KEY (id),
  CONSTRAINT stock_reconciliation_items_reconciliation_id_fkey FOREIGN KEY (reconciliation_id)
    REFERENCES public.stock_reconciliation(id) ON DELETE CASCADE,
  CONSTRAINT stock_reconciliation_items_batch_id_fkey FOREIGN KEY (batch_id)
    REFERENCES public.drug_batches(id) ON DELETE RESTRICT
);

-- ============================================
-- 15. PHARMACY USERS (Role-based access)
-- ============================================
DROP TABLE IF EXISTS public.pharmacy_users CASCADE;
CREATE TABLE IF NOT EXISTS public.pharmacy_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('pharmacy_admin', 'pharmacist', 'pharmacy_assistant', 'auditor')),
  permissions jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  assigned_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pharmacy_users_pkey PRIMARY KEY (id),
  CONSTRAINT pharmacy_users_user_id_key UNIQUE (user_id)
);

-- ============================================
-- 16. PHARMACY AUDIT LOG
-- ============================================
DROP TABLE IF EXISTS public.pharmacy_audit_log CASCADE;
CREATE TABLE IF NOT EXISTS public.pharmacy_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  table_affected text NOT NULL,
  record_id uuid NOT NULL,
  old_values jsonb NULL,
  new_values jsonb NULL,
  changed_by uuid NOT NULL,
  change_reason text NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pharmacy_audit_log_pkey PRIMARY KEY (id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_drug_batches_expiry ON public.drug_batches(expiry_date);
CREATE INDEX idx_drug_batches_status ON public.drug_batches(status);
CREATE INDEX idx_stock_movements_date ON public.stock_movements(movement_date);
CREATE INDEX idx_stock_movements_department ON public.stock_movements(department);
CREATE INDEX idx_prescriptions_patient ON public.prescriptions(patient_id);
CREATE INDEX idx_prescriptions_visit ON public.prescriptions(visit_id);
CREATE INDEX idx_prescriptions_status ON public.prescriptions(status);
CREATE INDEX idx_pharmacy_dispensing_date ON public.pharmacy_dispensing(dispensed_at);
CREATE INDEX idx_department_requests_status ON public.department_stock_requests(status);
CREATE INDEX idx_purchase_orders_supplier ON public.purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_date ON public.purchase_orders(order_date);

-- ============================================
-- SAMPLE DRUGS DATA
-- ============================================
INSERT INTO public.drugs (drug_name, generic_name, brand_name, category, strength, unit_of_measure, requires_prescription, reorder_level, reorder_quantity) VALUES
('Paracetamol', 'Acetaminophen', 'Panadol', 'analgesic', '500mg', 'tablets', true, 500, 1000),
('Ibuprofen', 'Ibuprofen', 'Brufen', 'analgesic', '200mg', 'tablets', true, 300, 600),
('Amoxicillin', 'Amoxicillin', 'Augmentin', 'antibiotic', '500mg', 'capsules', true, 200, 500),
('Ciprofloxacin', 'Ciprofloxacin', 'Cipro', 'antibiotic', '500mg', 'tablets', true, 150, 300),
('Normal Saline', 'Sodium Chloride', 'NS Solution', 'iv_fluid', '0.9%', 'ml', false, 100, 500),
('Dextrose 5%', 'Dextrose', 'Dextrose Solution', 'iv_fluid', '5%', 'ml', false, 100, 500),
('Oxytocin', 'Oxytocin', 'Oxytocin', 'other', '10 IU/ml', 'ml', true, 50, 100),
('DPT Vaccine', 'Diphtheria-Pertussis-Tetanus', 'PENTA', 'vaccine', '1 dose', 'vials', false, 100, 200),
('Polio Vaccine', 'Poliovirus', 'OPV', 'vaccine', '1 dose', 'drops', false, 100, 200),
('Propofol', 'Propofol', 'Diprivan', 'anesthetic', '10mg/ml', 'ml', true, 50, 100)
ON CONFLICT DO NOTHING;

-- ============================================
-- SAMPLE SUPPLIERS DATA
-- ============================================
INSERT INTO public.suppliers (supplier_name, supplier_code, contact_person, phone, email, city, payment_terms) VALUES
('Cosmos Limited', 'COSMOS001', 'John Kimani', '+254712345678', 'sales@cosmos.co.ke', 'Nairobi', 'net_30'),
('Cipla Kenya', 'CIPLA001', 'Jane Muthoni', '+254722345678', 'account@cipla.co.ke', 'Nairobi', 'net_45'),
('Medic Supplies East Africa', 'MEDIC001', 'Peter Omondi', '+254733345678', 'contact@medicsa.co.ke', 'Mombasa', 'net_30'),
('Glaxo Smith Kline', 'GSK001', 'Sarah Kipchoge', '+254741345678', 'orders@gsk.co.ke', 'Nairobi', 'net_60')
ON CONFLICT DO NOTHING;
