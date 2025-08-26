-- Atualizar RLS policies para personal_trainers para garantir isolamento por admin
-- Permitir que cada admin gerencie apenas seus próprios trainers

-- Remover políticas existentes
DROP POLICY IF EXISTS "Admins can manage personal trainers" ON public.personal_trainers;
DROP POLICY IF EXISTS "Admins can view their own trainers" ON public.personal_trainers;
DROP POLICY IF EXISTS "Super admins can view all trainers" ON public.personal_trainers;
DROP POLICY IF EXISTS "Users can view trainers from their admin" ON public.personal_trainers;

-- Criar políticas para admin_id específico
CREATE POLICY "Admins can manage their own trainers" 
ON public.personal_trainers 
FOR ALL 
USING (
  is_super_admin() OR 
  (is_admin() AND current_user_has_permission('manage_schedule'::admin_permission) AND admin_id = get_current_admin_id())
)
WITH CHECK (
  is_super_admin() OR 
  (is_admin() AND current_user_has_permission('manage_schedule'::admin_permission) AND admin_id = get_current_admin_id())
);

-- Usuários podem ver trainers do seu admin
CREATE POLICY "Users can view trainers from their admin" 
ON public.personal_trainers 
FOR SELECT 
USING (admin_id = get_user_admin_id(auth.uid()));

-- Super admins podem ver todos
CREATE POLICY "Super admins can view all trainers" 
ON public.personal_trainers 
FOR SELECT 
USING (is_super_admin());