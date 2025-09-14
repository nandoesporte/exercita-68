-- Ajustar políticas RLS para treinos específicos de usuário
-- Remover a política atual que permite que todos vejam todos os treinos
DROP POLICY IF EXISTS "Workouts are viewable by everyone" ON public.workouts;

-- Criar nova política que permite:
-- 1. Admins verem todos os treinos
-- 2. Usuários verem apenas treinos globais (user_id NULL) ou treinos atribuídos especificamente a eles
CREATE POLICY "Users can view workouts assigned to them or global workouts" 
ON public.workouts 
FOR SELECT 
USING (
  is_admin() OR 
  user_id IS NULL OR 
  auth.uid() = user_id
);