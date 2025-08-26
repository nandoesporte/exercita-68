-- Função para promover usuário a Super Admin (apenas uma vez)
CREATE OR REPLACE FUNCTION public.promote_to_super_admin(user_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_user_id UUID;
    result JSON;
BEGIN
    -- Buscar o usuário pelo email
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = user_email;
    
    IF target_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Usuário não encontrado');
    END IF;
    
    -- Verificar se já existe um super admin
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'super_admin') THEN
        RETURN json_build_object('success', false, 'message', 'Já existe um Super Admin no sistema');
    END IF;
    
    -- Promover usuário a Super Admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN json_build_object('success', true, 'message', 'Usuário promovido a Super Admin com sucesso');
END;
$$;

-- Atualizar a função is_admin existente para considerar o novo sistema
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  ), false);
$$;

-- Atualizar políticas de storage para incluir admin_id
CREATE POLICY "Admins can manage gym photos in their environment" 
ON storage.objects FOR ALL 
USING (
  bucket_id = 'gym_photos' AND (
    public.is_super_admin() OR
    (public.is_admin() AND 
     auth.uid()::text = (storage.foldername(name))[1])
  )
);

-- Função para automaticamente definir admin_id quando necessário
CREATE OR REPLACE FUNCTION public.set_admin_id_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Se o usuário é admin, definir seu próprio admin_id
    IF public.is_admin() AND NOT public.is_super_admin() THEN
        NEW.admin_id = public.get_current_admin_id();
    END IF;
    
    -- Se o usuário é comum, definir admin_id baseado no perfil
    IF NEW.user_id IS NOT NULL AND NEW.admin_id IS NULL THEN
        NEW.admin_id = public.get_user_admin_id(NEW.user_id);
    END IF;
    
    RETURN NEW;
END;
$$;

-- Adicionar triggers para auto-definir admin_id
CREATE TRIGGER set_admin_id_workouts
    BEFORE INSERT ON public.workouts
    FOR EACH ROW
    EXECUTE FUNCTION public.set_admin_id_on_insert();

CREATE TRIGGER set_admin_id_exercises
    BEFORE INSERT ON public.exercises
    FOR EACH ROW
    EXECUTE FUNCTION public.set_admin_id_on_insert();

CREATE TRIGGER set_admin_id_products
    BEFORE INSERT ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.set_admin_id_on_insert();

CREATE TRIGGER set_admin_id_appointments
    BEFORE INSERT ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.set_admin_id_on_insert();

CREATE TRIGGER set_admin_id_gym_photos
    BEFORE INSERT ON public.user_gym_photos
    FOR EACH ROW
    EXECUTE FUNCTION public.set_admin_id_on_insert();