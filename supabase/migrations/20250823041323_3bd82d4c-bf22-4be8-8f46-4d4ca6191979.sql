-- Create profile_images storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile_images', 
  'profile_images', 
  true, 
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
);

-- Create RLS policies for profile_images bucket
-- Allow users to upload their own profile images
CREATE POLICY "Users can upload their own profile images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'profile_images' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own profile images
CREATE POLICY "Users can view their own profile images" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'profile_images' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own profile images
CREATE POLICY "Users can update their own profile images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'profile_images' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own profile images
CREATE POLICY "Users can delete their own profile images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'profile_images' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to profile images since they're public bucket
CREATE POLICY "Public read access to profile images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile_images');