-- Add DELETE policy for workout_categories
CREATE POLICY "Only admins can delete workout categories" 
ON public.workout_categories 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.is_admin = true
));