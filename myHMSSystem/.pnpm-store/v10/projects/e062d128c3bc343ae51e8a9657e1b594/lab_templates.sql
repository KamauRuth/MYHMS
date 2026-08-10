-- Lab Result Templates Migration
-- This file creates templates for all common lab tests

-- First, ensure we have the test masters
INSERT INTO public.lab_test_master (test_name, test_code, category, sample_type, price, cost)
VALUES
  ('Full Blood Count', 'FBC', 'Hematology', 'Blood', 500.00, 150.00),
  ('Blood Glucose - Fasting', 'GLU-F', 'Clinical Chemistry', 'Blood', 300.00, 80.00),
  ('Blood Glucose - Random', 'GLU-R', 'Clinical Chemistry', 'Blood', 300.00, 80.00),
  ('Lipid Profile', 'LIPID', 'Clinical Chemistry', 'Blood', 750.00, 200.00),
  ('Liver Function Test', 'LFT', 'Clinical Chemistry', 'Blood', 600.00, 150.00),
  ('Renal Function Test', 'RFT', 'Clinical Chemistry', 'Blood', 600.00, 150.00),
  ('Thyroid Function Test', 'TFT', 'Clinical Chemistry', 'Blood', 1000.00, 250.00),
  ('Electrolytes', 'ELEC', 'Clinical Chemistry', 'Blood', 500.00, 120.00),
  ('Blood Culture', 'BCULTURE', 'Microbiology', 'Blood', 1200.00, 300.00),
  ('Urinalysis', 'UA', 'Urinalysis', 'Urine', 200.00, 50.00),
  ('Pregnancy Test', 'PREG', 'Immunology', 'Blood', 300.00, 80.00),
  ('HIV Test', 'HIV', 'Immunology', 'Blood', 1500.00, 300.00),
  ('Malaria Test', 'MAL', 'Parasitology', 'Blood', 400.00, 100.00),
  ('Widal Test', 'WIDAL', 'Serology', 'Blood', 600.00, 150.00),
  ('Chest X-Ray', 'CXR', 'Imaging', 'N/A', 1000.00, 300.00),
  ('Blood Pressure', 'BP', 'Vital Signs', 'N/A', 100.00, 20.00),
  ('Blood Type', 'BTYPE', 'Hematology', 'Blood', 400.00, 100.00),
  ('Retinol Binding Protein', 'RBP', 'Clinical Chemistry', 'Blood', 800.00, 200.00)
ON CONFLICT (test_code) DO NOTHING;

-- Now create templates for each test
-- Full Blood Count
INSERT INTO public.lab_result_templates (test_id, test_name, parameters)
SELECT id, test_name, jsonb_build_array(
  jsonb_build_object('parameter', 'WBC', 'units', '10^3/µL', 'reference_range', '4.5-11.0'),
  jsonb_build_object('parameter', 'RBC', 'units', '10^6/µL', 'reference_range', '4.5-5.9 (M), 4.1-5.1 (F)'),
  jsonb_build_object('parameter', 'Hemoglobin', 'units', 'g/dL', 'reference_range', '13.5-17.5 (M), 12-15.5 (F)'),
  jsonb_build_object('parameter', 'Hematocrit', 'units', '%', 'reference_range', '38.8-50 (M), 35-45 (F)'),
  jsonb_build_object('parameter', 'MCV', 'units', 'fL', 'reference_range', '80-100'),
  jsonb_build_object('parameter', 'MCH', 'units', 'pg', 'reference_range', '27-33'),
  jsonb_build_object('parameter', 'MCHC', 'units', 'g/dL', 'reference_range', '32-36'),
  jsonb_build_object('parameter', 'Platelets', 'units', '10^3/µL', 'reference_range', '150-400')
)
FROM public.lab_test_master WHERE test_code = 'FBC'
ON CONFLICT (test_id) DO NOTHING;

-- Blood Glucose
INSERT INTO public.lab_result_templates (test_id, test_name, parameters)
SELECT id, test_name, jsonb_build_array(
  jsonb_build_object('parameter', 'Glucose', 'units', 'mg/dL', 'reference_range', '70-100 (Fasting), <140 (Random)')
)
FROM public.lab_test_master WHERE test_code IN ('GLU-F', 'GLU-R')
ON CONFLICT (test_id) DO NOTHING;

-- Lipid Profile
INSERT INTO public.lab_result_templates (test_id, test_name, parameters)
SELECT id, test_name, jsonb_build_array(
  jsonb_build_object('parameter', 'Total Cholesterol', 'units', 'mg/dL', 'reference_range', '<200'),
  jsonb_build_object('parameter', 'LDL', 'units', 'mg/dL', 'reference_range', '<100'),
  jsonb_build_object('parameter', 'HDL', 'units', 'mg/dL', 'reference_range', '>40 (M), >50 (F)'),
  jsonb_build_object('parameter', 'Triglycerides', 'units', 'mg/dL', 'reference_range', '<150')
)
FROM public.lab_test_master WHERE test_code = 'LIPID'
ON CONFLICT (test_id) DO NOTHING;

-- Liver Function Test
INSERT INTO public.lab_result_templates (test_id, test_name, parameters)
SELECT id, test_name, jsonb_build_array(
  jsonb_build_object('parameter', 'AST', 'units', 'IU/L', 'reference_range', '10-40'),
  jsonb_build_object('parameter', 'ALT', 'units', 'IU/L', 'reference_range', '7-56'),
  jsonb_build_object('parameter', 'ALP', 'units', 'IU/L', 'reference_range', '30-120'),
  jsonb_build_object('parameter', 'Total Bilirubin', 'units', 'mg/dL', 'reference_range', '0.1-1.2'),
  jsonb_build_object('parameter', 'Direct Bilirubin', 'units', 'mg/dL', 'reference_range', '0.0-0.3'),
  jsonb_build_object('parameter', 'Albumin', 'units', 'g/dL', 'reference_range', '3.5-5.0')
)
FROM public.lab_test_master WHERE test_code = 'LFT'
ON CONFLICT (test_id) DO NOTHING;

-- Renal Function Test
INSERT INTO public.lab_result_templates (test_id, test_name, parameters)
SELECT id, test_name, jsonb_build_array(
  jsonb_build_object('parameter', 'Creatinine', 'units', 'mg/dL', 'reference_range', '0.7-1.3'),
  jsonb_build_object('parameter', 'BUN', 'units', 'mg/dL', 'reference_range', '7-20'),
  jsonb_build_object('parameter', 'Urea', 'units', 'mg/dL', 'reference_range', '2.5-7.1'),
  jsonb_build_object('parameter', 'eGFR', 'units', 'mL/min/1.73m2', 'reference_range', '>60')
)
FROM public.lab_test_master WHERE test_code = 'RFT'
ON CONFLICT (test_id) DO NOTHING;

-- Thyroid Function Test
INSERT INTO public.lab_result_templates (test_id, test_name, parameters)
SELECT id, test_name, jsonb_build_array(
  jsonb_build_object('parameter', 'TSH', 'units', 'mIU/L', 'reference_range', '0.4-4.0'),
  jsonb_build_object('parameter', 'Free T4', 'units', 'ng/dL', 'reference_range', '0.8-1.8'),
  jsonb_build_object('parameter', 'Free T3', 'units', 'pg/mL', 'reference_range', '2.3-4.2')
)
FROM public.lab_test_master WHERE test_code = 'TFT'
ON CONFLICT (test_id) DO NOTHING;

-- Electrolytes
INSERT INTO public.lab_result_templates (test_id, test_name, parameters)
SELECT id, test_name, jsonb_build_array(
  jsonb_build_object('parameter', 'Sodium', 'units', 'mEq/L', 'reference_range', '136-145'),
  jsonb_build_object('parameter', 'Potassium', 'units', 'mEq/L', 'reference_range', '3.5-5.0'),
  jsonb_build_object('parameter', 'Chloride', 'units', 'mEq/L', 'reference_range', '98-107'),
  jsonb_build_object('parameter', 'CO2', 'units', 'mEq/L', 'reference_range', '23-29')
)
FROM public.lab_test_master WHERE test_code = 'ELEC'
ON CONFLICT (test_id) DO NOTHING;

-- Urinalysis
INSERT INTO public.lab_result_templates (test_id, test_name, parameters)
SELECT id, test_name, jsonb_build_array(
  jsonb_build_object('parameter', 'Color', 'units', 'Descriptor', 'reference_range', 'Pale to Dark Yellow'),
  jsonb_build_object('parameter', 'Clarity', 'units', 'Descriptor', 'reference_range', 'Clear'),
  jsonb_build_object('parameter', 'pH', 'units', '', 'reference_range', '4.5-7.8'),
  jsonb_build_object('parameter', 'Protein', 'units', 'mg/dL', 'reference_range', 'Negative'),
  jsonb_build_object('parameter', 'Glucose', 'units', 'mg/dL', 'reference_range', 'Negative'),
  jsonb_build_object('parameter', 'Ketones', 'units', '', 'reference_range', 'Negative'),
  jsonb_build_object('parameter', 'RBC', 'units', '/hpf', 'reference_range', '0-3'),
  jsonb_build_object('parameter', 'WBC', 'units', '/hpf', 'reference_range', '0-5')
)
FROM public.lab_test_master WHERE test_code = 'UA'
ON CONFLICT (test_id) DO NOTHING;

-- Pregnancy Test
INSERT INTO public.lab_result_templates (test_id, test_name, parameters)
SELECT id, test_name, jsonb_build_array(
  jsonb_build_object('parameter', 'hCG', 'units', 'mIU/mL', 'reference_range', '<5 (Negative), >25 (Positive)')
)
FROM public.lab_test_master WHERE test_code = 'PREG'
ON CONFLICT (test_id) DO NOTHING;

-- HIV Test
INSERT INTO public.lab_result_templates (test_id, test_name, parameters)
SELECT id, test_name, jsonb_build_array(
  jsonb_build_object('parameter', 'HIV Antibody', 'units', '', 'reference_range', 'Non-Reactive')
)
FROM public.lab_test_master WHERE test_code = 'HIV'
ON CONFLICT (test_id) DO NOTHING;

-- Malaria Test
INSERT INTO public.lab_result_templates (test_id, test_name, parameters)
SELECT id, test_name, jsonb_build_array(
  jsonb_build_object('parameter', 'Plasmodium', 'units', '', 'reference_range', 'Not Seen')
)
FROM public.lab_test_master WHERE test_code = 'MAL'
ON CONFLICT (test_id) DO NOTHING;

-- Widal Test
INSERT INTO public.lab_result_templates (test_id, test_name, parameters)
SELECT id, test_name, jsonb_build_array(
  jsonb_build_object('parameter', 'Salmonella typhi O', 'units', '', 'reference_range', 'Negative'),
  jsonb_build_object('parameter', 'Salmonella typhi H', 'units', '', 'reference_range', 'Negative'),
  jsonb_build_object('parameter', 'Salmonella paratyphi A', 'units', '', 'reference_range', 'Negative')
)
FROM public.lab_test_master WHERE test_code = 'WIDAL'
ON CONFLICT (test_id) DO NOTHING;

-- Blood Type
INSERT INTO public.lab_result_templates (test_id, test_name, parameters)
SELECT id, test_name, jsonb_build_array(
  jsonb_build_object('parameter', 'ABO Type', 'units', '', 'reference_range', 'A, B, AB, or O'),
  jsonb_build_object('parameter', 'Rh Factor', 'units', '', 'reference_range', 'Positive or Negative')
)
FROM public.lab_test_master WHERE test_code = 'BTYPE'
ON CONFLICT (test_id) DO NOTHING;

-- Blood Pressure
INSERT INTO public.lab_result_templates (test_id, test_name, parameters)
SELECT id, test_name, jsonb_build_array(
  jsonb_build_object('parameter', 'Systolic', 'units', 'mmHg', 'reference_range', '<120'),
  jsonb_build_object('parameter', 'Diastolic', 'units', 'mmHg', 'reference_range', '<80')
)
FROM public.lab_test_master WHERE test_code = 'BP'
ON CONFLICT (test_id) DO NOTHING;
