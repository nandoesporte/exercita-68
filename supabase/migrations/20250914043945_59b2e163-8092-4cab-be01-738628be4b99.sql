-- Criar bucket para fotos de personal trainers
INSERT INTO storage.buckets (id, name, public) 
VALUES ('trainer_photos', 'trainer_photos', true);

-- Políticas RLS para o bucket trainer_photos
CREATE POLICY "Trainer photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'trainer_photos');

CREATE POLICY "Admins can upload trainer photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'trainer_photos' AND is_admin());

CREATE POLICY "Admins can update trainer photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'trainer_photos' AND is_admin());

CREATE POLICY "Admins can delete trainer photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'trainer_photos' AND is_admin());