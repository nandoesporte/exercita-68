-- Adicionar admin_id a todas as tabelas relevantes
ALTER TABLE public.profiles ADD COLUMN admin_id UUID REFERENCES public.admins(id);
ALTER TABLE public.workouts ADD COLUMN admin_id UUID REFERENCES public.admins(id);
ALTER TABLE public.exercises ADD COLUMN admin_id UUID REFERENCES public.admins(id);
ALTER TABLE public.workout_categories ADD COLUMN admin_id UUID REFERENCES public.admins(id);
ALTER TABLE public.products ADD COLUMN admin_id UUID REFERENCES public.admins(id);
ALTER TABLE public.product_categories ADD COLUMN admin_id UUID REFERENCES public.admins(id);
ALTER TABLE public.appointments ADD COLUMN admin_id UUID REFERENCES public.admins(id);
ALTER TABLE public.user_gym_photos ADD COLUMN admin_id UUID REFERENCES public.admins(id);
ALTER TABLE public.user_workout_history ADD COLUMN admin_id UUID REFERENCES public.admins(id);
ALTER TABLE public.workout_recommendations ADD COLUMN admin_id UUID REFERENCES public.admins(id);
ALTER TABLE public.orders ADD COLUMN admin_id UUID REFERENCES public.admins(id);
ALTER TABLE public.personal_trainers ADD COLUMN admin_id UUID REFERENCES public.admins(id);
ALTER TABLE public.payment_settings ADD COLUMN admin_id UUID REFERENCES public.admins(id);
ALTER TABLE public.pix_keys ADD COLUMN admin_id UUID REFERENCES public.admins(id);
ALTER TABLE public.equipment_based_workouts ADD COLUMN admin_id UUID REFERENCES public.admins(id);

-- Função para obter admin_id do perfil do usuário
CREATE OR REPLACE FUNCTION public.get_user_admin_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT admin_id 
  FROM public.profiles 
  WHERE id = _user_id
  LIMIT 1;
$$;

-- Atualizar as políticas RLS existentes para incluir isolamento por admin_id
-- PROFILES
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        public.is_super_admin() OR 
        (public.is_admin() AND admin_id = public.get_current_admin_id())
    );

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage their users profiles" ON public.profiles
    FOR ALL USING (
        public.is_super_admin() OR 
        (public.is_admin() AND admin_id = public.get_current_admin_id())
    );

-- WORKOUTS
DROP POLICY IF EXISTS "Anyone can view workouts" ON public.workouts;
DROP POLICY IF EXISTS "Admins can manage workouts" ON public.workouts;

CREATE POLICY "Users can view workouts from their admin" ON public.workouts
    FOR SELECT USING (
        public.is_super_admin() OR
        admin_id = public.get_user_admin_id(auth.uid()) OR
        admin_id IS NULL -- Workouts públicos do sistema
    );

CREATE POLICY "Admins can manage their workouts" ON public.workouts
    FOR ALL USING (
        public.is_super_admin() OR
        (public.is_admin() AND public.current_user_has_permission('manage_workouts') AND 
         admin_id = public.get_current_admin_id())
    );

-- EXERCISES
DROP POLICY IF EXISTS "Anyone can view exercises" ON public.exercises;
DROP POLICY IF EXISTS "Admins can manage exercises" ON public.exercises;

CREATE POLICY "Users can view exercises from their admin" ON public.exercises
    FOR SELECT USING (
        public.is_super_admin() OR
        admin_id = public.get_user_admin_id(auth.uid()) OR
        admin_id IS NULL -- Exercícios públicos do sistema
    );

CREATE POLICY "Admins can manage their exercises" ON public.exercises
    FOR ALL USING (
        public.is_super_admin() OR
        (public.is_admin() AND public.current_user_has_permission('manage_exercises') AND 
         admin_id = public.get_current_admin_id())
    );

-- WORKOUT CATEGORIES
DROP POLICY IF EXISTS "Anyone can view workout categories" ON public.workout_categories;
DROP POLICY IF EXISTS "Admins can manage workout categories" ON public.workout_categories;

CREATE POLICY "Users can view categories from their admin" ON public.workout_categories
    FOR SELECT USING (
        public.is_super_admin() OR
        admin_id = public.get_user_admin_id(auth.uid()) OR
        admin_id IS NULL -- Categorias públicas do sistema
    );

CREATE POLICY "Admins can manage their categories" ON public.workout_categories
    FOR ALL USING (
        public.is_super_admin() OR
        (public.is_admin() AND public.current_user_has_permission('manage_categories') AND 
         admin_id = public.get_current_admin_id())
    );