-- Corrigir política de segurança para personal_trainers
-- Remover política insegura que permite acesso público
DROP POLICY IF EXISTS "Everyone can view personal trainers" ON public.personal_trainers;

-- Criar políticas mais restritivas para personal_trainers
-- Usuários só podem ver trainers do seu admin
CREATE POLICY "Users can view trainers from their admin" 
ON public.personal_trainers 
FOR SELECT 
USING (admin_id = get_user_admin_id(auth.uid()));

-- Admins podem ver seus próprios trainers
CREATE POLICY "Admins can view their own trainers" 
ON public.personal_trainers 
FOR SELECT 
USING (is_admin() AND admin_id = get_current_admin_id());

-- Super admins podem ver todos os trainers
CREATE POLICY "Super admins can view all trainers" 
ON public.personal_trainers 
FOR SELECT 
USING (is_super_admin());

-- Corrigir problema de chave duplicada na tabela admin_subscriptions
-- Remover constraint único que está causando problemas
ALTER TABLE public.admin_subscriptions 
DROP CONSTRAINT IF EXISTS admin_subscriptions_admin_id_key;

-- Permitir múltiplas assinaturas por admin (histórico)
-- Mas criar índice para otimizar consultas pela assinatura mais recente
CREATE INDEX IF NOT EXISTS idx_admin_subscriptions_admin_created 
ON public.admin_subscriptions (admin_id, created_at DESC);