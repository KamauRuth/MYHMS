-- Add urgency and comments columns to lab_results table
-- Drop the constraints if they exist
ALTER TABLE public.lab_results DROP CONSTRAINT IF EXISTS lab_results_urgency_check;

-- Add the urgency column if it doesn't exist (without constraint yet)
ALTER TABLE public.lab_results 
ADD COLUMN IF NOT EXISTS urgency text DEFAULT 'low';

-- Update any existing rows with NULL urgency to 'low'
UPDATE public.lab_results 
SET urgency = 'low' 
WHERE urgency IS NULL;

-- Add back the check constraint
ALTER TABLE public.lab_results 
ADD CONSTRAINT lab_results_urgency_check CHECK (urgency IN ('low', 'medium', 'high'));

-- Add comments column if it doesn't exist
ALTER TABLE public.lab_results 
ADD COLUMN IF NOT EXISTS comments text DEFAULT '';
