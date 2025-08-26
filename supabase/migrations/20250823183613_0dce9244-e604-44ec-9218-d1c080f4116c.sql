-- Add RLS policies to validate admin permissions on backend operations

-- Function to check if current user has specific admin permission
CREATE OR REPLACE FUNCTION public.current_user_has_admin_permission(_permission admin_permission)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN public.is_super_admin() THEN true
    WHEN public.is_admin() THEN (
      SELECT EXISTS (
        SELECT 1 
        FROM public.admin_permissions ap
        JOIN public.admins a ON ap.admin_id = a.id
        WHERE a.user_id = auth.uid() 
        AND ap.permission = _permission
      )
    )
    ELSE false
  END;
$function$;

-- Update admin_permissions table RLS policy to ensure proper access control
DROP POLICY IF EXISTS "Admins can view their own permissions" ON admin_permissions;
CREATE POLICY "Admins can view their own permissions"
ON admin_permissions
FOR SELECT
TO authenticated
USING (
  -- Super admins can see all permissions
  public.is_super_admin() OR
  -- Regular admins can only see their own permissions
  admin_id IN (
    SELECT id FROM admins WHERE user_id = auth.uid()
  )
);

-- Ensure admins table has proper RLS
DROP POLICY IF EXISTS "Admins can view accessible admin records" ON admins;
CREATE POLICY "Admins can view accessible admin records"
ON admins
FOR SELECT
TO authenticated
USING (
  -- Super admins can see all admins
  public.is_super_admin() OR
  -- Regular admins can only see their own record
  user_id = auth.uid()
);