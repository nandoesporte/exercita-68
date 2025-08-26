-- Create storage bucket for exercises if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('exercises', 'exercises', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for exercises bucket
CREATE POLICY "Allow authenticated users to upload exercise images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'exercises' AND 
  auth.role() = 'authenticated' AND
  (storage.extension(name) = ANY(ARRAY['gif', 'png', 'jpg', 'jpeg', 'webp']))
);

CREATE POLICY "Allow public read access to exercise images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'exercises');

CREATE POLICY "Allow authenticated users to delete their exercise images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'exercises' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to update exercise images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'exercises' AND 
  auth.role() = 'authenticated'
) 
WITH CHECK (
  bucket_id = 'exercises' AND
  (storage.extension(name) = ANY(ARRAY['gif', 'png', 'jpg', 'jpeg', 'webp']))
);