-- Primeiro, vamos verificar os planos ativos
-- Se não houver planos, vamos criar um plano básico

-- Inserir um plano básico se não existir
INSERT INTO public.subscription_plans (name, description, price, duration_days, is_active)
SELECT 'Plano Básico', 'Plano de assinatura básico para administradores', 29.90, 30, true
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE is_active = true);

-- Ajustar as políticas RLS para permitir que super admins criem assinaturas para outros admins
DROP POLICY IF EXISTS "Admins can create their own subscriptions" ON public.admin_subscriptions;

-- Criar nova política que permite aos super admins criar assinaturas para qualquer admin
CREATE POLICY "Super admins can create any subscription" 
ON public.admin_subscriptions 
FOR INSERT 
WITH CHECK (is_super_admin());

-- Manter a política existente para admins normais criarem suas próprias assinaturas
CREATE POLICY "Admins can create their own subscriptions" 
ON public.admin_subscriptions 
FOR INSERT 
WITH CHECK (
  is_admin() AND 
  admin_id IN (SELECT admins.id FROM admins WHERE admins.user_id = auth.uid())
);