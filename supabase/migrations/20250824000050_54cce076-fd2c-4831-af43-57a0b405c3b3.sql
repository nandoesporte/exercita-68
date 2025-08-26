-- Corrigir políticas RLS para personal_trainers
-- Remover políticas existentes que estão muito restritivas
DROP POLICY IF EXISTS "Admins can manage their personal trainers" ON public.personal_trainers;
DROP POLICY IF EXISTS "Admins can view their personal trainers" ON public.personal_trainers;

-- Criar novas políticas mais permissivas para admins
CREATE POLICY "Admins can manage personal trainers" 
ON public.personal_trainers 
FOR ALL 
USING (
  is_super_admin() OR 
  (is_admin() AND current_user_has_permission('manage_schedule'::admin_permission))
)
WITH CHECK (
  is_super_admin() OR 
  (is_admin() AND current_user_has_permission('manage_schedule'::admin_permission))
);

-- Política para visualização (todos podem ver personal trainers)
CREATE POLICY "Everyone can view personal trainers" 
ON public.personal_trainers 
FOR SELECT 
USING (true);