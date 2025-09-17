-- Criar perfis para usuários que existem em auth.users mas não em public.profiles
INSERT INTO public.profiles (id, first_name, last_name, is_admin, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'first_name', 'Usuário') as first_name,
  COALESCE(au.raw_user_meta_data->>'last_name', '') as last_name,
  false as is_admin, -- Marcar como usuário comum por padrão
  au.created_at,
  now() as updated_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL  -- Usuários sem perfil
  AND au.email NOT LIKE '%@admin.%'  -- Evitar contas de sistema
  AND au.email IS NOT NULL
  AND au.email != '';

-- Atualizar a função handle_new_user para garantir que novos usuários sejam criados como usuários comuns por padrão
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer
SET search_path = 'public'
AS $$
DECLARE
  admin_id_to_assign uuid;
BEGIN
  -- Check if admin_id was passed in metadata
  IF new.raw_user_meta_data->>'created_by_admin_id' IS NOT NULL THEN
    admin_id_to_assign := (new.raw_user_meta_data->>'created_by_admin_id')::uuid;
  ELSE
    admin_id_to_assign := NULL;
  END IF;

  INSERT INTO public.profiles (id, first_name, last_name, admin_id, instance_id, is_admin)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    admin_id_to_assign,
    CASE 
      WHEN new.raw_user_meta_data->>'instance_id' IS NOT NULL 
      THEN (new.raw_user_meta_data->>'instance_id')::uuid
      ELSE NULL
    END,
    -- Só marcar como admin se explicitamente indicado nos metadados
    CASE 
      WHEN new.raw_user_meta_data->>'is_admin' = 'true' THEN true
      ELSE false
    END
  );
  RETURN new;
END;
$$;