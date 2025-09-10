-- Create running_plans table
CREATE TABLE IF NOT EXISTS public.running_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  plan jsonb NOT NULL,
  age integer NOT NULL,
  weight numeric NOT NULL,
  fitness_level text NOT NULL,
  goal text NOT NULL,
  available_time text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.running_plans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own running plans" 
ON public.running_plans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own running plans" 
ON public.running_plans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own running plans" 
ON public.running_plans 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own running plans" 
ON public.running_plans 
FOR DELETE 
USING (auth.uid() = user_id);

-- Admins can see all running plans
CREATE POLICY "Admins can view all running plans" 
ON public.running_plans 
FOR ALL 
USING (is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_running_plans_updated_at
BEFORE UPDATE ON public.running_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();