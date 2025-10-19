-- Create healthcare professionals table
CREATE TABLE IF NOT EXISTS public.healthcare_professionals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL, -- médico, nutricionista, fisioterapeuta, psicólogo, etc.
  sub_specialty TEXT, -- cardiologia, ortopedia, etc.
  description TEXT,
  photo_url TEXT,
  credentials TEXT, -- CRM, CRN, CREFITO, CRP, etc.
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  is_active BOOLEAN DEFAULT true,
  admin_id UUID REFERENCES public.admins(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.healthcare_professionals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view active healthcare professionals"
ON public.healthcare_professionals
FOR SELECT
USING (is_active = true OR is_admin());

CREATE POLICY "Only admins can manage healthcare professionals"
ON public.healthcare_professionals
FOR ALL
USING (is_admin());

-- Add professional_id to appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS professional_id UUID REFERENCES public.healthcare_professionals(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_professional_id 
ON public.appointments(professional_id);

CREATE INDEX IF NOT EXISTS idx_healthcare_professionals_specialty 
ON public.healthcare_professionals(specialty);

CREATE INDEX IF NOT EXISTS idx_healthcare_professionals_active 
ON public.healthcare_professionals(is_active);

-- Create updated_at trigger for healthcare_professionals
CREATE TRIGGER update_healthcare_professionals_updated_at
BEFORE UPDATE ON public.healthcare_professionals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.healthcare_professionals IS 'Stores information about healthcare professionals (doctors, nutritionists, physiotherapists, psychologists, etc.)';
COMMENT ON COLUMN public.healthcare_professionals.specialty IS 'Main specialty: médico, nutricionista, fisioterapeuta, psicólogo, personal trainer, etc.';
COMMENT ON COLUMN public.healthcare_professionals.sub_specialty IS 'Sub-specialty within main specialty: cardiologia, ortopedia, esportiva, etc.';