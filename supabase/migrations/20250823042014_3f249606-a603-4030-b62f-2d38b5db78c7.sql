-- Create gym_photos storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gym_photos', 'gym_photos', true);

-- Create RLS policies for gym_photos bucket
CREATE POLICY "Users can view gym photos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'gym_photos');

CREATE POLICY "Users can upload their own gym photos" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'gym_photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own gym photos" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'gym_photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own gym photos" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'gym_photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can manage all gym photos" 
ON storage.objects FOR ALL 
USING (
  bucket_id = 'gym_photos' AND 
  is_admin()
);