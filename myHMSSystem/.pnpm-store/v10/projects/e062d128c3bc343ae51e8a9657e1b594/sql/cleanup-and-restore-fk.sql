-- ============================================
-- CLEANUP ORPHANED ADMISSIONS AND RESTORE FK
-- ============================================

-- 1. Delete admissions with orphaned patient_ids
DELETE FROM public.admissions a
WHERE NOT EXISTS (
  SELECT 1 FROM public.patients p 
  WHERE p.id = a.patient_id
);

-- 2. Verify all remaining admissions have valid patient_ids
SELECT COUNT(*) as remaining_admissions
FROM public.admissions a
WHERE EXISTS (
  SELECT 1 FROM public.patients p 
  WHERE p.id = a.patient_id
);

-- 3. Show remaining admissions after cleanup
SELECT 
  a.id,
  a.patient_id,
  p.first_name,
  p.last_name,
  a.ward,
  a.reason,
  a.status,
  a.admitted_at
FROM public.admissions a
JOIN public.patients p ON a.patient_id = p.id
ORDER BY a.admitted_at DESC;

-- 4. Re-establish the foreign key constraint
ALTER TABLE public.admissions
ADD CONSTRAINT admissions_patient_id_fkey 
FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admissions_patient_id ON public.admissions(patient_id);
CREATE INDEX IF NOT EXISTS idx_admissions_status ON public.admissions(status);
CREATE INDEX IF NOT EXISTS idx_admissions_admitted_at ON public.admissions(admitted_at DESC);

-- 6. Verify the constraint exists
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS referenced_table_name,
  ccu.column_name AS referenced_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'admissions'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.constraint_name = 'admissions_patient_id_fkey';
