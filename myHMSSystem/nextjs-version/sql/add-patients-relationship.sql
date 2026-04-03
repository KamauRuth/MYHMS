-- ============================================
-- ADD FOREIGN KEY RELATIONSHIP: ADMISSIONS → PATIENTS
-- ============================================
-- This script establishes the relationship between admissions and patients tables
-- Allows Supabase to recognize the relationship for proper joins in the API

-- 1. ADD FOREIGN KEY CONSTRAINT FROM ADMISSIONS TO PATIENTS
-- This enables the API to join admissions with patient data
ALTER TABLE public.admissions
ADD CONSTRAINT admissions_patient_id_fkey 
FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

-- 2. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX idx_admissions_patient_id ON public.admissions(patient_id);
CREATE INDEX idx_admissions_status ON public.admissions(status);
CREATE INDEX idx_admissions_admitted_at ON public.admissions(admitted_at DESC);

-- ============================================
-- VERIFICATION
-- ============================================
-- Verify the foreign key relationship exists:
SELECT 
  constraint_name,
  table_name,
  column_name,
  referenced_table_name,
  referenced_column_name
FROM (
  SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS referenced_table_name,
    ccu.column_name AS referenced_column_name
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'admissions'
    AND ccu.table_name = 'patients'
) AS fk
ORDER BY constraint_name;
