-- Fix storage RLS policy for gym_photos bucket uploads

-- Drop the broken INSERT policy that has no WITH CHECK condition
DROP POLICY IF EXISTS "gym_photos_insert_policy" ON storage.objects;

-- Create new INSERT policy with proper WITH CHECK condition
-- This allows users to upload photos to their own folder (user-id/ prefix)
CREATE POLICY "gym_photos_insert_policy" ON storage.objects
FOR INSERT TO public
WITH CHECK (
  bucket_id = 'gym_photos' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Also ensure we have proper SELECT policy for gym photos
DROP POLICY IF EXISTS "gym_photos_select_policy" ON storage.objects;

CREATE POLICY "gym_photos_select_policy" ON storage.objects
FOR SELECT TO public
USING (
  bucket_id = 'gym_photos' AND 
  (
    -- Users can view their own photos
    (storage.foldername(name))[1] = auth.uid()::text OR
    -- Admins can view all photos
    is_admin()
  )
);

-- Ensure UPDATE policy for approval status changes by admins
DROP POLICY IF EXISTS "gym_photos_update_policy" ON storage.objects;

CREATE POLICY "gym_photos_update_policy" ON storage.objects
FOR UPDATE TO public
USING (
  bucket_id = 'gym_photos' AND 
  (
    -- Users can update their own photos
    (storage.foldername(name))[1] = auth.uid()::text OR
    -- Admins can update any photos for approval
    is_admin()
  )
);