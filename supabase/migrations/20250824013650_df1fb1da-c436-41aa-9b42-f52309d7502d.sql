-- Fix gym_photos storage policies for regular users
-- Drop conflicting policies first
DROP POLICY IF EXISTS "Admins can manage gym photos in their environment" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload gym photos to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view gym photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update gym photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete gym photos" ON storage.objects;

-- Create proper INSERT policy for all authenticated users
CREATE POLICY "All users can upload gym photos to own folder" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'gym_photos' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- CREATE SELECT policy for viewing photos
CREATE POLICY "Users can view gym photos" ON storage.objects
FOR SELECT TO authenticated
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

-- CREATE UPDATE policy for admins only
CREATE POLICY "Admins can update gym photos" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'gym_photos' AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- CREATE DELETE policy for users and admins
CREATE POLICY "Users can delete their gym photos" ON storage.objects
FOR DELETE TO authenticated
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