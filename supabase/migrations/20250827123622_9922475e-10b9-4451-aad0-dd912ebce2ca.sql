-- Create health_data table for storing user health metrics
CREATE TABLE public.health_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  steps INTEGER,
  heart_rate INTEGER,
  sleep_hours DECIMAL(4,2),
  calories DECIMAL(6,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.health_data ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own health data" 
ON public.health_data 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own health data" 
ON public.health_data 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health data" 
ON public.health_data 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all health data" 
ON public.health_data 
FOR ALL 
USING (is_admin());

-- Create index for better performance on user queries
CREATE INDEX idx_health_data_user_date ON public.health_data(user_id, date DESC);

-- Create index for date queries
CREATE INDEX idx_health_data_date ON public.health_data(date DESC);