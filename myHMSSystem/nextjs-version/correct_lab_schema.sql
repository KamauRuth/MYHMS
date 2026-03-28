-- Corrected Lab Results Schema for HMS System
-- This schema matches the application code expectations

-- Drop existing table if it exists
DROP TABLE IF EXISTS public.lab_results CASCADE;

-- Create lab_results table with correct structure
CREATE TABLE public.lab_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL,
  results jsonb NULL, -- JSON array of test parameters and results
  status text NOT NULL DEFAULT 'pending_verification',
  technician_id text NULL,
  entered_at timestamp with time zone DEFAULT now(),
  verified_by text NULL,
  verified_at timestamp with time zone NULL,
  released_at timestamp with time zone NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lab_results_pkey PRIMARY KEY (id),
  CONSTRAINT lab_results_request_id_fkey FOREIGN KEY (request_id)
    REFERENCES public.lab_requests(id) ON DELETE CASCADE
);

-- Create lab_result_templates table for test parameter templates
DROP TABLE IF EXISTS public.lab_result_templates CASCADE;

CREATE TABLE public.lab_result_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL,
  test_name text NOT NULL,
  parameters jsonb NOT NULL, -- JSON array of parameter definitions
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lab_result_templates_pkey PRIMARY KEY (id),
  CONSTRAINT lab_result_templates_test_id_fkey FOREIGN KEY (test_id)
    REFERENCES public.lab_test_master(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lab_results_request_id ON public.lab_results(request_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_status ON public.lab_results(status);
CREATE INDEX IF NOT EXISTS idx_lab_result_templates_test_id ON public.lab_result_templates(test_id);

-- Insert sample templates for common tests
INSERT INTO public.lab_result_templates (test_id, test_name, parameters) VALUES
(
  (SELECT id FROM lab_test_master WHERE test_name ILIKE '%cbc%' LIMIT 1),
  'Complete Blood Count',
  '[
    {"parameter": "Hemoglobin", "units": "g/dL", "reference_range": "12-16"},
    {"parameter": "Hematocrit", "units": "%", "reference_range": "36-46"},
    {"parameter": "WBC Count", "units": "×10³/µL", "reference_range": "4-11"},
    {"parameter": "Platelet Count", "units": "×10³/µL", "reference_range": "150-450"},
    {"parameter": "RBC Count", "units": "×10⁶/µL", "reference_range": "4.2-5.4"}
  ]'::jsonb
),
(
  (SELECT id FROM lab_test_master WHERE test_name ILIKE '%glucose%' LIMIT 1),
  'Random Blood Glucose',
  '[
    {"parameter": "Glucose", "units": "mg/dL", "reference_range": "70-140"}
  ]'::jsonb
),
(
  (SELECT id FROM lab_test_master WHERE test_name ILIKE '%lft%' LIMIT 1),
  'Liver Function Test',
  '[
    {"parameter": "Total Bilirubin", "units": "mg/dL", "reference_range": "0.3-1.2"},
    {"parameter": "Direct Bilirubin", "units": "mg/dL", "reference_range": "0.0-0.3"},
    {"parameter": "SGOT (AST)", "units": "IU/L", "reference_range": "5-40"},
    {"parameter": "SGPT (ALT)", "units": "IU/L", "reference_range": "7-56"},
    {"parameter": "Alkaline Phosphatase", "units": "IU/L", "reference_range": "44-147"}
  ]'::jsonb
);