-- Create storage buckets for the application

-- Create avatars bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Create exercises bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exercises',
  'exercises',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
);

-- Create gym-photos bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gym-photos',
  'gym-photos',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Create workouts bucket (public) 
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'workouts',
  'workouts',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Create products bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Create RLS policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create RLS policies for exercises bucket
CREATE POLICY "Exercise images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'exercises');

CREATE POLICY "Only admins can upload exercise media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'exercises' AND 
  public.is_admin()
);

CREATE POLICY "Only admins can update exercise media" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'exercises' AND 
  public.is_admin()
);

CREATE POLICY "Only admins can delete exercise media" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'exercises' AND 
  public.is_admin()
);

-- Create RLS policies for gym-photos bucket
CREATE POLICY "Gym photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'gym-photos');

CREATE POLICY "Users can upload gym photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'gym-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their gym photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'gym-photos' AND 
  (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
);

CREATE POLICY "Users can delete their gym photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'gym-photos' AND 
  (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
);

-- Create RLS policies for workouts bucket
CREATE POLICY "Workout images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'workouts');

CREATE POLICY "Only admins can upload workout images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'workouts' AND 
  public.is_admin()
);

CREATE POLICY "Only admins can update workout images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'workouts' AND 
  public.is_admin()
);

CREATE POLICY "Only admins can delete workout images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'workouts' AND 
  public.is_admin()
);

-- Create RLS policies for products bucket
CREATE POLICY "Product images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'products');

CREATE POLICY "Only admins can upload product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'products' AND 
  public.is_admin()
);

CREATE POLICY "Only admins can update product images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'products' AND 
  public.is_admin()
);

CREATE POLICY "Only admins can delete product images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'products' AND 
  public.is_admin()
);