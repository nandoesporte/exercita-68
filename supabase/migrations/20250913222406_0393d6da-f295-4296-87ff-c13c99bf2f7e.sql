-- Add DELETE policy for workouts
CREATE POLICY "Only admins can delete workouts" 
ON public.workouts 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);