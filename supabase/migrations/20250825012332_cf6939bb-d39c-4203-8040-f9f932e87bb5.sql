-- Fix RLS policies for admins table to be properly restrictive
-- Drop existing permissive policies and create restrictive ones

DROP POLICY IF EXISTS "Only admins can view admin data" ON public.admins;
DROP POLICY IF EXISTS "Only admins can create admin records" ON public.admins;
DROP POLICY IF EXISTS "Only admins can update admin records" ON public.admins;
DROP POLICY IF EXISTS "Only admins can delete admin records" ON public.admins;

-- Create restrictive policies that properly block unauthorized access
CREATE POLICY "Only admins can view admin data"
ON public.admins
FOR SELECT
TO public
USING (is_admin());

CREATE POLICY "Only admins can create admin records"
ON public.admins
FOR INSERT
TO public
WITH CHECK (is_admin());

CREATE POLICY "Only admins can update admin records"
ON public.admins
FOR UPDATE
TO public
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Only admins can delete admin records"
ON public.admins
FOR DELETE
TO public
USING (is_admin());

-- Also ensure the is_admin function is properly defined
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$;