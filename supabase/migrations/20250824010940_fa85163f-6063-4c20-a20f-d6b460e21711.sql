-- Drop the overly permissive policy
DROP POLICY "Users can view gym photos" ON storage.objects;

-- Create a more restrictive policy for viewing gym photos
CREATE POLICY "Users can view their own gym photos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'gym_photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);