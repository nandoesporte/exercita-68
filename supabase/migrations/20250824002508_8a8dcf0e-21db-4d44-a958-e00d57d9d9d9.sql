-- Fix exercises visibility policy to allow proper viewing for admins and users
-- First, drop the current policies
DROP POLICY IF EXISTS "Admins can manage their exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can view exercises from their admin" ON public.exercises;

-- Create new policies that allow proper access
-- Admins can manage their own exercises
CREATE POLICY "Admins can manage their exercises" 
ON public.exercises FOR ALL
USING (
  is_super_admin() OR 
  (is_admin() AND current_user_has_permission('manage_exercises'::admin_permission) AND (admin_id = get_current_admin_id() OR admin_id IS NULL))
)
WITH CHECK (
  is_super_admin() OR 
  (is_admin() AND current_user_has_permission('manage_exercises'::admin_permission))
);

-- Users and admins can view exercises from their admin or global exercises
CREATE POLICY "Users and admins can view exercises" 
ON public.exercises FOR SELECT
USING (
  is_super_admin() OR 
  (admin_id = get_user_admin_id(auth.uid())) OR 
  (admin_id = get_current_admin_id()) OR 
  (admin_id IS NULL)
);