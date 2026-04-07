-- ========================================
-- DENTAL PROCEDURES SCHEMA
-- ========================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS dental_procedures;
DROP TABLE IF EXISTS procedure_master;

-- Create procedure_master table
CREATE TABLE procedure_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(100) DEFAULT 'General', -- e.g., General, Oral Surgery, Ortho, Prostho
  price DECIMAL(10, 2) NOT NULL,
  duration_minutes INT DEFAULT 30,
  requires_anesthesia BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create dental_procedures table (recording actual procedures done)
CREATE TABLE dental_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dental_visit_id UUID NOT NULL,
  procedure_id UUID NOT NULL REFERENCES procedure_master(id) ON DELETE CASCADE,
  tooth_number VARCHAR(10),
  tooth_surface VARCHAR(50), -- e.g., facial, lingual, occlusal, incisal
  status VARCHAR(50) DEFAULT 'pending', -- pending, in-progress, completed, cancelled
  notes TEXT,
  cost DECIMAL(10, 2),
  scheduled_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dental_visit_id) REFERENCES dental_visits(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_dental_procedures_visit ON dental_procedures(dental_visit_id);
CREATE INDEX idx_dental_procedures_procedure ON dental_procedures(procedure_id);
CREATE INDEX idx_dental_procedures_status ON dental_procedures(status);
CREATE INDEX idx_procedure_master_category ON procedure_master(category);

-- Insert some default procedures
INSERT INTO procedure_master (name, category, price, duration_minutes, requires_anesthesia, description) VALUES
  ('Prophylaxis (Cleaning)', 'General', 1500.00, 30, false, 'Routine teeth cleaning and plaque removal'),
  ('Basic Filling (Composite)', 'General', 2500.00, 45, true, 'Single surface composite filling'),
  ('Root Canal Therapy', 'Endodontics', 5000.00, 120, true, 'Complete root canal treatment'),
  ('Tooth Extraction', 'Oral Surgery', 2000.00, 30, true, 'Simple tooth extraction'),
  ('Surgical Extraction', 'Oral Surgery', 4000.00, 60, true, 'Complex surgical extraction'),
  ('Crown Preparation', 'Prostho', 6000.00, 90, true, 'Crown preparation and placement'),
  ('Scaling & Root Planing', 'Perio', 3000.00, 60, false, 'Deep cleaning for gum disease'),
  ('Orthodontic Adjustment', 'Ortho', 2500.00, 45, false, 'Braces or aligner adjustment'),
  ('Bridge Preparation', 'Prostho', 7500.00, 120, true, 'Dental bridge preparation'),
  ('Implant Surgery', 'Oral Surgery', 12000.00, 120, true, 'Dental implant placement')
ON CONFLICT (name) DO NOTHING;
