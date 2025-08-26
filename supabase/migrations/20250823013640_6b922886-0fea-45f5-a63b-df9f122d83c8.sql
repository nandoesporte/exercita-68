-- Fix security vulnerabilities identified in the scan

-- 1. Fix Personal Trainer Contact Information - restrict to admins only
DROP POLICY IF EXISTS "Authenticated users can view personal trainers" ON public.personal_trainers;

CREATE POLICY "Admins can view personal trainers" 
ON public.personal_trainers 
FOR SELECT 
USING (is_admin());

-- 2. Fix Business Payment Configuration - restrict to admins only  
DROP POLICY IF EXISTS "Anyone can view payment settings" ON public.payment_settings;

CREATE POLICY "Admins can view payment settings" 
ON public.payment_settings 
FOR SELECT 
USING (is_admin());

-- 3. Fix AI Analysis Results - restrict to photo owner and admins
DROP POLICY IF EXISTS "Users can view gym photo analysis" ON public.gym_photo_analysis;

CREATE POLICY "Photo owner and admins can view gym photo analysis" 
ON public.gym_photo_analysis 
FOR SELECT 
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM public.user_gym_photos 
    WHERE id = gym_photo_analysis.photo_id 
    AND user_id = auth.uid()
  )
);

-- Ensure all tables that should be admin-only are properly secured
-- Double-check pix_keys policies are restrictive (they already are)
DROP POLICY IF EXISTS "Admins can view PIX keys" ON public.pix_keys;
DROP POLICY IF EXISTS "Admins can manage PIX keys" ON public.pix_keys;

CREATE POLICY "Admins can manage PIX keys" 
ON public.pix_keys 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can view PIX keys" 
ON public.pix_keys 
FOR SELECT 
USING (is_admin());