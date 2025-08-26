-- Additional security measures for admin data protection

-- Ensure RLS is enabled on the admins table (redundant but safe)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Force drop and recreate policies with explicit security
DROP POLICY IF EXISTS "Only admins can view admin data" ON public.admins;
DROP POLICY IF EXISTS "Only admins can create admin records" ON public.admins;
DROP POLICY IF EXISTS "Only admins can update admin records" ON public.admins;
DROP POLICY IF EXISTS "Only admins can delete admin records" ON public.admins;

-- Create more explicit restrictive policies
CREATE POLICY "Admin data - authenticated admins only"
ON public.admins
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Deny all access to anonymous users explicitly
CREATE POLICY "Admin data - deny anonymous access"
ON public.admins
FOR ALL
TO anon
USING (false);

-- Add a comment to document the security intent
COMMENT ON TABLE public.admins IS 'Contains sensitive administrator information. Access restricted to authenticated admin users only via RLS policies.';