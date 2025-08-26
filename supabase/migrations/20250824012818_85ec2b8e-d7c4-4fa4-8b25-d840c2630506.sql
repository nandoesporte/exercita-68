-- Fix the gym_photos storage bucket policies completely

-- First, let's check what policies exist and clean them up
-- Drop all existing policies for gym_photos bucket
DROP POLICY IF EXISTS "gym_photos_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "gym_photos_select_policy" ON storage.objects; 
DROP POLICY IF EXISTS "gym_photos_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "gym_photos_delete_policy" ON storage.objects;

-- Create comprehensive storage policies for gym_photos bucket
-- INSERT policy: Users can upload to their own folder
CREATE POLICY "Users can upload gym photos to own folder" ON storage.objects
FOR INSERT TO public
WITH CHECK (
  bucket_id = 'gym_photos' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- SELECT policy: Users can view their own photos, admins can view all
CREATE POLICY "Users can view gym photos" ON storage.objects
FOR SELECT TO public
USING (
  bucket_id = 'gym_photos' AND 
  (
    -- Users can view their own photos
    (storage.foldername(name))[1] = auth.uid()::text OR
    -- Admins can view all photos
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  )
);

-- UPDATE policy: Admins can update all gym photos  
CREATE POLICY "Admins can update gym photos" ON storage.objects
FOR UPDATE TO public
USING (
  bucket_id = 'gym_photos' AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- DELETE policy: Users can delete their own photos, admins can delete all
CREATE POLICY "Users can delete gym photos" ON storage.objects
FOR DELETE TO public
USING (
  bucket_id = 'gym_photos' AND 
  (
    -- Users can delete their own photos
    (storage.foldername(name))[1] = auth.uid()::text OR
    -- Admins can delete all photos
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  )
);