-- Fix any existing uppercase status values in lab_requests
-- This handles any legacy data that was inserted with uppercase statuses

UPDATE public.lab_requests 
SET status = LOWER(status) 
WHERE status NOT IN ('pending', 'in_progress', 'completed', 'cancelled');

-- Verify the update
SELECT DISTINCT status FROM public.lab_requests;
