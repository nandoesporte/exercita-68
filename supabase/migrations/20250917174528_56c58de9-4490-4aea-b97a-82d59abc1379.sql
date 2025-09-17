-- Fix security vulnerability: Restrict access to personal trainers table
-- Only authenticated users should be able to view trainer contact information

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Everyone can view personal trainers" ON public.personal_trainers;

-- Create a new secure policy that requires authentication
CREATE POLICY "Authenticated users can view personal trainers" 
ON public.personal_trainers 
FOR SELECT 
TO authenticated
USING (true);

-- Keep the admin-only modification policy as is
-- (it's already secure)