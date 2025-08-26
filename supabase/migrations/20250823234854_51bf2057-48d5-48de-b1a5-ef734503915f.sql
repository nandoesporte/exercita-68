-- Adicionar política RLS para permitir que alunos vejam as chaves PIX do seu admin
CREATE POLICY "Users can view PIX keys from their admin" 
ON public.pix_keys 
FOR SELECT 
USING (
  admin_id = get_user_admin_id(auth.uid())
);