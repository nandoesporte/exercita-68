-- Verificar e criar apenas as policies que não existem para o storage bucket gym_photos

-- DROP policies existentes que podem estar incorretas e recriar
DROP POLICY IF EXISTS "Users can update their own gym photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own gym photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own gym photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own gym photos" ON storage.objects;

-- Criar policies corretas para permitir que usuários autenticados gerenciem suas próprias fotos
CREATE POLICY "Users can upload gym photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'gym_photos' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view gym photos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'gym_photos' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR auth.role() = 'authenticated'
  )
);

CREATE POLICY "Users can update gym photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'gym_photos' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete gym photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'gym_photos' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);