-- ============================================
-- FORCEFULLY REMOVE CONSTRAINT AND DIAGNOSE
-- ============================================

-- 1. Drop the constraint with CASCADE if needed
ALTER TABLE public.admissions 
DROP CONSTRAINT IF EXISTS admissions_patient_id_fkey CASCADE;

-- 2. Find any other foreign key constraints on admissions pointing to patients
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_name = 'admissions'
  AND constraint_type = 'FOREIGN KEY';

-- 3. If there are other constraints, drop them by name (replace CONSTRAINT_NAME below)
-- ALTER TABLE public.admissions DROP CONSTRAINT CONSTRAINT_NAME;

-- 4. Now check for orphaned patient_ids
SELECT DISTINCT a.patient_id 
FROM public.admissions a
LEFT JOIN public.patients p ON a.patient_id = p.id
WHERE p.id IS NULL
ORDER BY a.patient_id;

-- 5. Show admissions with orphaned patient_ids
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

-- 6. Show all patients
SELECT id, first_name, last_name, phone 
FROM public.patients 
ORDER BY created_at DESC;
