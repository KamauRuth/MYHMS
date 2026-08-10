-- ============================================
-- FIX ORPHANED INVOICES (Missing Patient Links)
-- ============================================
-- This finds invoices without patient_id and helps fix them

-- 1. IDENTIFY THE PROBLEM: Invoices with NULL patient_id
SELECT 'Orphaned Invoices (NULL patient_id)' as step;
SELECT id, total_amount, balance, status, created_at
FROM public.invoices
WHERE patient_id IS NULL OR patient_id = '';

-- 2. VIEW ASSOCIATED VISIT/LAB DATA TO FIND THE CORRECT PATIENT
SELECT 'Check Associated Data' as step;
SELECT 
  i.id as invoice_id,
  i.total_amount,
  i.balance,
  i.patient_id,
  i.visit_id,
  v.patient_id as visit_patient_id,
  p.first_name,
  p.last_name
FROM public.invoices i
LEFT JOIN public.visits v ON i.visit_id = v.id
LEFT JOIN public.patients p ON v.patient_id = p.id
WHERE i.patient_id IS NULL;

-- 3. CHECK LAB REQUESTS ASSOCIATED WITH THESE INVOICES
SELECT 'Lab Request Links' as step;
SELECT DISTINCT
  lr.patient_id as lab_patient_id,
  i.id as invoice_id,
  i.total_amount
FROM public.lab_requests lr
LEFT JOIN public.invoice_items ii ON lr.test_id::text = ii.item_id
LEFT JOIN public.invoices i ON ii.invoice_id = i.id
WHERE i.patient_id IS NULL;

-- 4. AUTOMATED FIX - Link invoices to visits' patients
-- This works if the invoice has a visit_id
UPDATE public.invoices i
SET patient_id = v.patient_id
FROM public.visits v
WHERE i.visit_id = v.id 
  AND i.patient_id IS NULL
  AND v.patient_id IS NOT NULL;

-- 5. VERIFY THE FIX
SELECT 'After Fix - Remaining NULL patient_ids' as step;
SELECT COUNT(*) as still_orphaned
FROM public.invoices
WHERE patient_id IS NULL;

-- 6. IF STILL ORPHANED - Try linking through lab requests
-- First, find lab requests with patient_id and their invoices
SELECT 'Invoices needing lab-based fix' as step;
SELECT DISTINCT i.id, i.total_amount, i.patient_id
FROM public.invoices i
LEFT JOIN public.invoice_items ii ON i.id = ii.invoice_id
LEFT JOIN public.lab_requests lr ON ii.item_id = lr.test_id::text
WHERE i.patient_id IS NULL
  AND lr.patient_id IS NOT NULL
LIMIT 10;

-- MANUAL FIX (If automated doesn't work):
-- Replace the IDs below with your actual data
-- UPDATE public.invoices SET patient_id = 'PATIENT_ID_HERE' WHERE id = 'INVOICE_ID_HERE';

-- Example for your orphaned invoices (if you know the patient):
-- UPDATE public.invoices SET patient_id = '74c0ab38-7208-4ed8-8ec6-4dfb8604cf6e' WHERE id = 'ef1b5292-75ff-44f4-b087-1ab06d6edcfc';
