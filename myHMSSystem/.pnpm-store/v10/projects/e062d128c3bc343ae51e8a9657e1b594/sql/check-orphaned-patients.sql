-- ============================================
-- DIAGNOSE ORPHANED PATIENT RECORDS
-- ============================================
-- Check for admissions records with patient_ids that don't exist in patients table

-- 1. Remove the constraint temporarily so we can analyze the data
ALTER TABLE public.admissions 
DROP CONSTRAINT IF EXISTS admissions_patient_id_fkey;

-- 2. Find all patient IDs in admissions that don't exist in patients
SELECT DISTINCT a.patient_id 
FROM public.admissions a
LEFT JOIN public.patients p ON a.patient_id = p.id
WHERE p.id IS NULL
ORDER BY a.patient_id;

-- 3. Count how many admissions have orphaned patient_ids
SELECT COUNT(*) as orphaned_admission_count
FROM public.admissions a
LEFT JOIN public.patients p ON a.patient_id = p.id
WHERE p.id IS NULL;

-- 4. Get details of admissions with orphaned patient IDs
SELECT 
  a.id,
  a.patient_id,
  a.visit_id,
  a.ward,
  a.reason,
  a.status,
  a.admitted_at
FROM public.admissions a
LEFT JOIN public.patients p ON a.patient_id = p.id
WHERE p.id IS NULL
ORDER BY a.admitted_at DESC;

-- 5. Show all patients that exist
SELECT id, first_name, last_name, phone, created_at
FROM public.patients
ORDER BY created_at DESC;
