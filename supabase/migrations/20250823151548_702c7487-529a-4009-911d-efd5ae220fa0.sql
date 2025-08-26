-- Criar função para buscar todos os usuários do sistema
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  raw_user_meta_data jsonb,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  banned_until timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Verificar se o usuário atual é Super Admin
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Apenas Super Admins podem visualizar todos os usuários do sistema';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data,
    u.created_at,
    u.last_sign_in_at,
    u.banned_until
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$;