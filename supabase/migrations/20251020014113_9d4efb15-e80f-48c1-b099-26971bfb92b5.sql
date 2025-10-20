-- Add additional fields to healthcare_professionals table for detailed profiles
ALTER TABLE public.healthcare_professionals 
ADD COLUMN IF NOT EXISTS experience TEXT,
ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.healthcare_professionals.experience IS 'Professional experience and background';
COMMENT ON COLUMN public.healthcare_professionals.services IS 'Array of services offered by the professional';