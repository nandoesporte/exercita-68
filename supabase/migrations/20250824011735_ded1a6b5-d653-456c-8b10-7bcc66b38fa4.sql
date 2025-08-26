-- Fix storage RLS policies for gym_photos bucket

-- Drop conflicting admin-only INSERT policies that prevent user uploads
DROP POLICY IF EXISTS "Admins can upload gym photos" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload gym photos" ON storage.objects;

-- Ensure users can upload gym photos to their own folder
CREATE POLICY "Users can upload their own gym photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'gym_photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Ensure users can view their own gym photos
CREATE POLICY "Users can view their own gym photos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'gym_photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Ensure users can delete their own gym photos
CREATE POLICY "Users can delete their own gym photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'gym_photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to manage all gym photos
CREATE POLICY "Admins can manage all gym photos" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'gym_photos' 
  AND is_admin()
);