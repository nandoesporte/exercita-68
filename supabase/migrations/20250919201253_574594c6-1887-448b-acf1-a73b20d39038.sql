-- Add specific policy for super admins to delete appointments
CREATE POLICY "Super admins can delete all appointments" 
ON public.appointments 
FOR DELETE 
USING (is_super_admin());

-- Also add policy for super admins to update appointments
CREATE POLICY "Super admins can update all appointments" 
ON public.appointments 
FOR UPDATE 
USING (is_super_admin());

-- And ensure super admins can view all appointments
CREATE POLICY "Super admins can view all appointments" 
ON public.appointments 
FOR SELECT 
USING (is_super_admin());