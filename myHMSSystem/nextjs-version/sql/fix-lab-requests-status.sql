-- Fix lab_requests status check constraint
-- Step 1: Drop existing check constraint
ALTER TABLE public.lab_requests DROP CONSTRAINT IF EXISTS lab_requests_status_check CASCADE;

-- Step 2: Update any invalid status values to 'pending' (safe default)
UPDATE public.lab_requests 
SET status = 'pending' 
WHERE status IS NULL OR status NOT IN ('pending', 'in_progress', 'completed', 'cancelled');

-- Step 3: Add new check constraint with all allowed status values
ALTER TABLE public.lab_requests ADD CONSTRAINT lab_requests_status_check 
  CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'));
