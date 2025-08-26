-- Corrigir políticas RLS para admin_subscriptions
-- Permitir que admins criem suas próprias assinaturas

-- Remover políticas existentes que podem estar bloqueando
DROP POLICY IF EXISTS "Admins can view their own subscription" ON public.admin_subscriptions;
DROP POLICY IF EXISTS "Admins can update their own subscription" ON public.admin_subscriptions;
DROP POLICY IF EXISTS "Super admins can manage all admin subscriptions" ON public.admin_subscriptions;

-- Criar políticas mais permissivas para admins criarem assinaturas
CREATE POLICY "Admins can manage their own subscriptions" 
ON public.admin_subscriptions 
FOR ALL 
USING (
  is_super_admin() OR 
  (is_admin() AND admin_id IN (
    SELECT id FROM admins WHERE user_id = auth.uid()
  ))
)
WITH CHECK (
  is_super_admin() OR 
  (is_admin() AND admin_id IN (
    SELECT id FROM admins WHERE user_id = auth.uid()
  ))
);

-- Super admins podem gerenciar todas as assinaturas
CREATE POLICY "Super admins can manage all admin subscriptions" 
ON public.admin_subscriptions 
FOR ALL 
USING (is_super_admin())
WITH CHECK (is_super_admin());