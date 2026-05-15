
-- Align lab_samples schema with frontend expectations
-- This fixes the "Could not find the 'sample_status' column" error

-- Rename storage_status to sample_status to match frontend code
ALTER TABLE IF EXISTS public.lab_samples
RENAME COLUMN storage_status TO sample_status;

-- Create notes column from rejection_reason (nullable for flexible use)
ALTER TABLE IF EXISTS public.lab_samples
ADD COLUMN IF NOT EXISTS notes text NULL;

-- Migrate rejection_reason data to notes where sample was rejected
UPDATE public.lab_samples
SET notes = rejection_reason
WHERE is_rejected = true AND rejection_reason IS NOT NULL;

-- Add constraint to sample_status for valid values
ALTER TABLE IF EXISTS public.lab_samples
ADD CONSTRAINT sample_status_check CHECK (sample_status IN ('collected', 'received', 'processing', 'damaged', 'rejected'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lab_samples_sample_status ON public.lab_samples(sample_status);
CREATE INDEX IF NOT EXISTS idx_lab_samples_request_id ON public.lab_samples(request_id);
