-- Criar policies para o storage bucket gym_photos
-- Permitir que usuários autenticados façam upload de suas próprias fotos
CREATE POLICY "Users can upload their own gym photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'gym_photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que usuários autenticados vejam suas próprias fotos
CREATE POLICY "Users can view their own gym photos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'gym_photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que usuários autenticados atualizem suas próprias fotos
CREATE POLICY "Users can update their own gym photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'gym_photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que usuários autenticados deletem suas próprias fotos
CREATE POLICY "Users can delete their own gym photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'gym_photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Garantir que a tabela user_gym_photos tenha a coluna user_id não nula
-- e as policies corretas (já deveria existir baseado no schema)
ALTER TABLE public.user_gym_photos 
ALTER COLUMN user_id SET NOT NULL;