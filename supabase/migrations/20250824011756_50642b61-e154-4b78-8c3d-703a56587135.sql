-- Drop and recreate storage RLS policies for gym_photos bucket

-- Drop all existing gym_photos storage policies
DROP POLICY IF EXISTS "Users can upload their own gym photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own gym photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own gym photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all gym photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload gym photos" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload gym photos" ON storage.objects;

-- Create clean, non-conflicting policies for gym_photos bucket
CREATE POLICY "gym_photos_insert_policy" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'gym_photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "gym_photos_select_policy" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'gym_photos' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR is_admin()
  )
);

CREATE POLICY "gym_photos_delete_policy" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'gym_photos' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR is_admin()
  )
);