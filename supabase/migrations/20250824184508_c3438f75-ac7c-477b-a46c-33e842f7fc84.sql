-- Criar policies com nomes únicos para evitar conflito
CREATE POLICY "authenticated_users_upload_gym_photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'gym_photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "authenticated_users_view_gym_photos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'gym_photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "authenticated_users_update_gym_photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'gym_photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "authenticated_users_delete_gym_photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'gym_photos' 
  AND auth.role() = 'authenticated'
);