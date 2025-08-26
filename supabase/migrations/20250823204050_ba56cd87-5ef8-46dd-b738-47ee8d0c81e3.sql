-- Fix RLS policies to work properly for admins viewing their own data

-- Update workout_categories policy for admins to view their categories
DROP POLICY IF EXISTS "Users can view categories from their admin" ON workout_categories;
CREATE POLICY "Users can view categories from their admin" 
ON workout_categories 
FOR SELECT 
USING (
  is_super_admin() OR 
  (admin_id = get_user_admin_id(auth.uid())) OR 
  (admin_id = get_current_admin_id()) OR 
  (admin_id IS NULL)
);

-- Update exercises policy for admins to view their exercises  
DROP POLICY IF EXISTS "Users can view exercises from their admin" ON exercises;
CREATE POLICY "Users can view exercises from their admin" 
ON exercises 
FOR SELECT 
USING (
  is_super_admin() OR 
  (admin_id = get_user_admin_id(auth.uid())) OR 
  (admin_id = get_current_admin_id()) OR 
  (admin_id IS NULL)
);

-- Update profiles policy for admins to view their users
DROP POLICY IF EXISTS "Admins can manage their users profiles" ON profiles;
CREATE POLICY "Admins can manage their users profiles" 
ON profiles 
FOR ALL 
USING (
  is_super_admin() OR 
  (is_admin() AND (admin_id = get_current_admin_id()))
);