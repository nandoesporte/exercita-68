-- Add field to track nutritionist requests
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS nutritionist_request_sent BOOLEAN DEFAULT false;

-- Create table for nutritionist requests/leads
CREATE TABLE IF NOT EXISTS public.nutritionist_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'scheduled', 'completed', 'cancelled')),
  profile_data JSONB,
  nutrition_data JSONB,
  diary_summary JSONB,
  notes TEXT,
  contacted_at TIMESTAMP WITH TIME ZONE,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.nutritionist_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own nutritionist requests"
  ON public.nutritionist_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create own nutritionist requests"
  ON public.nutritionist_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all nutritionist requests"
  ON public.nutritionist_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Admins can update all requests
CREATE POLICY "Admins can update nutritionist requests"
  ON public.nutritionist_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_nutritionist_requests_updated_at
  BEFORE UPDATE ON public.nutritionist_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_nutritionist_requests_user_id ON public.nutritionist_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_nutritionist_requests_status ON public.nutritionist_requests(status);
CREATE INDEX IF NOT EXISTS idx_nutritionist_requests_created_at ON public.nutritionist_requests(created_at DESC);