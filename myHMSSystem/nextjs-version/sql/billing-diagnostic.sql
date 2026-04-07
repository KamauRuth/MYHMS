-- ============================================
-- BILLING DATABASE DIAGNOSTIC SCRIPT
-- ============================================
-- Run this to diagnose billing update issues

-- 1. Check if invoices table exists and has correct structure
SELECT 'Invoices Table Structure' as check_name;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'invoices'
ORDER BY ordinal_position;

-- 2. Check if payments table exists
SELECT 'Payments Table Structure' as check_name;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'payments'
ORDER BY ordinal_position;

-- 3. Check foreign key relationships
SELECT 'Foreign Key Relationships' as check_name;
SELECT constraint_name, table_name, column_name, foreign_table_name, foreign_column_name
FROM information_schema.key_column_usage
WHERE table_name IN ('invoices', 'payments')
AND constraint_name LIKE '%fkey%'
ORDER BY table_name;

-- 4. Sample invoices data
SELECT 'Sample Unpaid Invoices' as check_name;
SELECT id, patient_id, total_amount, balance, status, created_at
FROM public.invoices
WHERE status = 'unpaid'
LIMIT 5;

-- 5. Check if patients foreign key works
SELECT 'Invoices with Patient Join' as check_name;
SELECT i.id, i.patient_id, p.first_name, p.last_name, i.total_amount, i.balance, i.status
FROM public.invoices i
LEFT JOIN public.patients p ON i.patient_id = p.id
WHERE i.status = 'unpaid'
LIMIT 5;

-- 6. Check sample payments
SELECT 'Sample Payments' as check_name;
SELECT id, invoice_id, amount_paid, payment_method, created_at
FROM public.payments
LIMIT 10;

-- 7. Check if there are any NULL patient_ids in invoices
SELECT 'Invoices with NULL patient_id' as check_name;
SELECT COUNT(*) as count_null_patients
FROM public.invoices
WHERE patient_id IS NULL AND status = 'unpaid';

-- 8. Check invoices table indexes
SELECT 'Invoices Indexes' as check_name;
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'invoices';
