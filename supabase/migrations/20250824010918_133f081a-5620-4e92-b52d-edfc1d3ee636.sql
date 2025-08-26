-- Create RLS policies for gym_photos storage bucket
-- Allow users to upload their own gym photos
CREATE POLICY "Users can upload their own gym photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'gym_photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own gym photos
CREATE POLICY "Users can view their own gym photos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'gym_photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own gym photos
CREATE POLICY "Users can update their own gym photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'gym_photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own gym photos
CREATE POLICY "Users can delete their own gym photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'gym_photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to view all gym photos
CREATE POLICY "Admins can view all gym photos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'gym_photos' AND 
  is_admin()
);