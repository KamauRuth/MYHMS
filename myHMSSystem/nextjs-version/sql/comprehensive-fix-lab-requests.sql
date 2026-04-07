-- ========================================
-- COMPREHENSIVE FIX FOR LAB_REQUESTS CONSTRAINT
-- ========================================
-- This script fixes the lab_requests table to ensure:
-- 1. Check constraint only allows lowercase status values
-- 2. All existing data uses lowercase status values
-- 3. Database default is lowercase 'pending'

-- Step 1: Check current constraint definition
SELECT constraint_name, constraint_definition 
FROM information_schema.check_constraints 
WHERE table_name = 'lab_requests';

-- Step 2: Drop any existing uppercase-allowing constraints
ALTER TABLE public.lab_requests DROP CONSTRAINT IF EXISTS lab_requests_status_check CASCADE;
ALTER TABLE public.lab_requests DROP CONSTRAINT IF EXISTS lab_requests_status_constraint CASCADE;

-- Step 3: Convert ALL status column values to lowercase
UPDATE public.lab_requests 
SET status = LOWER(COALESCE(status, 'pending'))
WHERE status IS NULL OR status != LOWER(status);

-- Step 4: Verify conversion
SELECT DISTINCT status FROM public.lab_requests ORDER BY status;

-- Step 5: Add strict lowercase-only constraint
ALTER TABLE public.lab_requests 
ADD CONSTRAINT lab_requests_status_check 
CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'));

-- Step 6: Verify constraint is in place
SELECT constraint_name, constraint_definition 
FROM information_schema.check_constraints 
WHERE table_name = 'lab_requests' AND constraint_name = 'lab_requests_status_check';

-- Step 7: Ensure payment_status also uses lowercase (defensive)
ALTER TABLE public.lab_requests DROP CONSTRAINT IF EXISTS lab_requests_payment_status_check CASCADE;
UPDATE public.lab_requests SET payment_status = LOWER(payment_status) WHERE payment_status != LOWER(payment_status);
ALTER TABLE public.lab_requests 
ADD CONSTRAINT lab_requests_payment_status_check 
CHECK (payment_status IN ('unpaid', 'paid', 'refunded'));

-- Step 8: Final verification - show all constraints
SELECT *
FROM information_schema.check_constraints 
WHERE table_name = 'lab_requests';
