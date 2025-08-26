-- Verificar e corrigir todas as funções com search_path mutable
-- Atualizar todas as funções existentes para ter search_path fixo

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $$
  SELECT public.has_role(auth.uid(), 'super_admin');
$$;

CREATE OR REPLACE FUNCTION public.get_current_admin_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $$
  SELECT admin_id 
  FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.admin_has_permission(_admin_id uuid, _permission admin_permission)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_permissions
    WHERE admin_id = _admin_id AND permission = _permission
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_has_permission(_permission admin_permission)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $$
  SELECT CASE 
    WHEN public.is_super_admin() THEN true
    WHEN public.is_admin() THEN public.admin_has_permission(public.get_current_admin_id(), _permission)
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_admin_id(_user_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $$
  SELECT admin_id 
  FROM public.profiles 
  WHERE id = _user_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $$
  SELECT COALESCE((
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  ), false);
$$;

CREATE OR REPLACE FUNCTION public.set_admin_id_on_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $$
begin
  -- Try to insert the profile, but don't fail the user creation if it fails
  begin
    insert into public.profiles (
      id, 
      first_name, 
      last_name, 
      avatar_url
    )
    values (
      new.id,
      new.raw_user_meta_data->>'first_name',
      new.raw_user_meta_data->>'last_name',
      new.raw_user_meta_data->>'avatar_url'
    );
  exception when others then
    -- Log the error but don't prevent user creation
    raise log 'Failed to create profile for user %: %', new.id, sqlerrm;
  end;
  
  return new;
end;
$$;