-- Função para promover/despromover usuário para admin
CREATE OR REPLACE FUNCTION public.toggle_user_admin_status(
  target_user_id UUID,
  make_admin BOOLEAN
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
  admin_record_id UUID;
BEGIN
  -- Verificar se o usuário atual é Super Admin
  IF NOT is_super_admin() THEN
    RETURN json_build_object('success', false, 'message', 'Apenas Super Admins podem modificar status de administradores');
  END IF;

  -- Buscar informações do usuário
  SELECT 
    u.email,
    COALESCE(p.first_name || ' ' || p.last_name, u.email) AS full_name
  INTO user_email, user_name
  FROM auth.users u
  LEFT JOIN profiles p ON u.id = p.id
  WHERE u.id = target_user_id;

  IF user_email IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Usuário não encontrado');
  END IF;

  IF make_admin THEN
    -- PROMOVER para Admin
    
    -- Verificar se já é admin
    IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = target_user_id AND role = 'admin') THEN
      RETURN json_build_object('success', false, 'message', 'Usuário já é administrador');
    END IF;

    -- Criar registro na tabela admins
    INSERT INTO admins (
      name,
      email,
      user_id,
      status,
      is_active,
      created_by
    ) VALUES (
      user_name,
      user_email,
      target_user_id,
      'active',
      true,
      auth.uid()
    ) RETURNING id INTO admin_record_id;

    -- Adicionar role de admin
    INSERT INTO user_roles (
      user_id,
      role
    ) VALUES (
      target_user_id,
      'admin'
    );

    -- Atualizar profile para marcar como admin
    UPDATE profiles 
    SET is_admin = true
    WHERE id = target_user_id;

    RETURN json_build_object(
      'success', true, 
      'message', user_name || ' agora é Admin',
      'admin_record_id', admin_record_id
    );

  ELSE
    -- DESPROMOVER de Admin
    
    -- Verificar se é admin
    IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = target_user_id AND role = 'admin') THEN
      RETURN json_build_object('success', false, 'message', 'Usuário não é administrador');
    END IF;

    -- Remover role de admin
    DELETE FROM user_roles 
    WHERE user_id = target_user_id AND role = 'admin';

    -- Remover permissões de admin (se existirem)
    DELETE FROM admin_permissions 
    WHERE admin_id IN (
      SELECT id FROM admins WHERE user_id = target_user_id
    );

    -- Remover registro da tabela admins
    DELETE FROM admins 
    WHERE user_id = target_user_id;

    -- Atualizar profile para remover marca de admin
    UPDATE profiles 
    SET is_admin = false
    WHERE id = target_user_id;

    RETURN json_build_object(
      'success', true, 
      'message', user_name || ' voltou a ser Usuário Comum'
    );

  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', 'Erro: ' || SQLERRM);
END;
$$;