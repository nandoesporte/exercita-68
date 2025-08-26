-- Create trainer_photos storage bucket for personal trainer profile photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'trainer_photos', 
  'trainer_photos', 
  true, 
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Create RLS policies for trainer_photos bucket
-- Allow admins to manage trainer photos
CREATE POLICY "Admins can upload trainer photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'trainer_photos' AND 
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

CREATE POLICY "Admins can view trainer photos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'trainer_photos' AND 
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

CREATE POLICY "Admins can update trainer photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'trainer_photos' AND 
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

CREATE POLICY "Admins can delete trainer photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'trainer_photos' AND 
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- Allow public read access to trainer photos since they're public bucket
CREATE POLICY "Public read access to trainer photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'trainer_photos');