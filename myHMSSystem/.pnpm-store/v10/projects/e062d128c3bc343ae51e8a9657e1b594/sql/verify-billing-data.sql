-- ============================================
-- VERIFY DATA INTEGRITY FOR BILLING
-- ============================================
-- Run these queries to ensure your billing data is correct

-- 1. Check if you have patients
SELECT 'Patients in Database' as check_name;
SELECT COUNT(*) as total_patients, 
       SUM(CASE WHEN first_name IS NOT NULL THEN 1 ELSE 0 END) as with_names
FROM public.patients;

-- 2. Check if you have invoices
SELECT 'Invoices in Database' as check_name;
SELECT COUNT(*) as total_invoices,
       SUM(CASE WHEN status = 'unpaid' THEN 1 ELSE 0 END) as unpaid_count,
       SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
       SUM(CASE WHEN patient_id IS NOT NULL THEN 1 ELSE 0 END) as with_patient_id
FROM public.invoices;

-- 3. Find invoices without patients (problem: Unknown Patient)
SELECT 'Invoices Missing Patient Link' as check_name;
SELECT id, patient_id, total_amount, status, created_at
FROM public.invoices
WHERE patient_id IS NULL;

-- 4. Find invoices with patients that don't exist (orphaned references)
SELECT 'Orphaned Invoice References' as check_name;
SELECT i.id, i.patient_id, i.total_amount, i.status
FROM public.invoices i
LEFT JOIN public.patients p ON i.patient_id = p.id
WHERE i.patient_id IS NOT NULL AND p.id IS NULL;

-- 5. Sample of invoices WITH their patient names
SELECT 'Sample Invoices with Patient Data' as check_name;
SELECT 
  i.id as invoice_id,
  i.patient_id,
  p.first_name,
  p.last_name,
  i.total_amount,
  i.balance,
  i.status,
  i.created_at
FROM public.invoices i
LEFT JOIN public.patients p ON i.patient_id = p.id
WHERE i.status = 'unpaid'
LIMIT 10;

-- 6. Check specific invoice (replace with your actual invoice ID)
-- SELECT i.*, p.first_name, p.last_name
-- FROM public.invoices i
-- LEFT JOIN public.patients p ON i.patient_id = p.id
-- WHERE i.id = 'YOUR_INVOICE_ID_HERE';
