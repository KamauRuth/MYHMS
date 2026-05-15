-- Add close timestamp to consultations
ALTER TABLE IF EXISTS public.consultations
ADD COLUMN IF NOT EXISTS status text NULL;

ALTER TABLE IF EXISTS public.consultations
ADD COLUMN IF NOT EXISTS closed_at timestamp with time zone NULL;
