-- Create storage bucket for food photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'food-photos',
  'food-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for food-photos bucket
CREATE POLICY "Users can upload their own food photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'food-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own food photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'food-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own food photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'food-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can view food photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'food-photos');