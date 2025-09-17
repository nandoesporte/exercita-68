-- Fix the two function search path issues by updating functions that don't have SET search_path

-- Update admin_update_user function to include SET search_path
CREATE OR REPLACE FUNCTION public.admin_update_user(target_user_id uuid, p_first_name text DEFAULT NULL::text, p_last_name text DEFAULT NULL::text, p_email text DEFAULT NULL::text, p_password text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  current_admin_id uuid;
  user_admin_id uuid;
  update_result json;
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.is_admin() THEN
    RETURN json_build_object('success', false, 'message', 'Acesso negado: privilégios de administrador necessários');
  END IF;

  -- Obter o admin_id do usuário atual
  SELECT a.id INTO current_admin_id 
  FROM public.admins a 
  WHERE a.user_id = auth.uid() 
  LIMIT 1;

  IF current_admin_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Administrador não encontrado');
  END IF;

  -- Verificar se o usuário alvo está vinculado a este admin
  SELECT admin_id INTO user_admin_id 
  FROM public.profiles 
  WHERE id = target_user_id;

  -- Super admins podem editar qualquer usuário, admins normais só podem editar usuários vinculados
  IF NOT public.is_super_admin() AND (user_admin_id IS NULL OR user_admin_id != current_admin_id) THEN
    RETURN json_build_object('success', false, 'message', 'Você só pode editar usuários vinculados a você');
  END IF;

  -- Atualizar dados do perfil (nome)
  IF p_first_name IS NOT NULL OR p_last_name IS NOT NULL THEN
    UPDATE public.profiles 
    SET 
      first_name = COALESCE(p_first_name, first_name),
      last_name = COALESCE(p_last_name, last_name),
      updated_at = now()
    WHERE id = target_user_id;
  END IF;

  -- Atualizar email no auth.users se fornecido
  IF p_email IS NOT NULL THEN
    UPDATE auth.users 
    SET 
      email = p_email,
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('email', p_email)::jsonb,
      updated_at = now()
    WHERE id = target_user_id;
  END IF;

  -- Para atualizar senha, precisamos usar uma abordagem diferente
  -- Nota: A atualização de senha em produção normalmente requer um processo de redefinição
  -- Por segurança, vamos apenas registrar a solicitação mas não implementar aqui
  IF p_password IS NOT NULL THEN
    -- Em um ambiente de produção, você enviaria um email de redefinição de senha
    -- Por enquanto, vamos apenas registrar que a senha foi solicitada para ser alterada
    RAISE NOTICE 'Solicitação de alteração de senha para usuário % registrada', target_user_id;
  END IF;

  RETURN json_build_object('success', true, 'message', 'Dados do usuário atualizados com sucesso');

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', 'Erro ao atualizar usuário: ' || SQLERRM);
END;
$function$;

-- Update toggle_user_admin_status function to include SET search_path
CREATE OR REPLACE FUNCTION public.toggle_user_admin_status(target_user_id uuid, make_admin boolean)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    target_user_email text;
    current_status boolean;
    is_caller_super_admin boolean;
BEGIN
    -- Check if caller is at least admin
    IF NOT (SELECT COALESCE(is_admin, false) FROM public.profiles WHERE id = auth.uid()) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Acesso negado: privilégios de administrador necessários'
        );
    END IF;

    -- Check if caller is super admin
    SELECT public.is_super_admin() INTO is_caller_super_admin;

    -- Get current admin status and email
    SELECT COALESCE(p.is_admin, false), COALESCE(u.email, p.first_name || '@***')
    INTO current_status, target_user_email
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE p.id = target_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Usuário não encontrado'
        );
    END IF;

    -- Prevent removing admin status from self
    IF target_user_id = auth.uid() AND NOT make_admin THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Você não pode remover seus próprios privilégios de administrador'
        );
    END IF;

    -- Prevent regular admins from promoting users to admin (only super admins can do this)
    IF make_admin AND NOT is_caller_super_admin THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Apenas Super Admins podem promover usuários a administradores'
        );
    END IF;

    -- Prevent removing super admin status
    IF NOT make_admin AND EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = target_user_id) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Não é possível remover privilégios de Super Admin'
        );
    END IF;

    -- If already in desired state, return success but inform user
    IF current_status = make_admin THEN
        RETURN json_build_object(
            'success', true,
            'message', CASE 
                WHEN make_admin THEN 'Usuário já é administrador'
                ELSE 'Usuário já é usuário comum'
            END
        );
    END IF;

    -- Update admin status in profiles
    UPDATE public.profiles 
    SET 
        is_admin = make_admin,
        updated_at = now()
    WHERE id = target_user_id;

    -- If promoting to admin, create record in admins table
    IF make_admin THEN
        INSERT INTO public.admins (user_id, name, email, status, is_active)
        SELECT 
            p.id,
            COALESCE(p.first_name || ' ' || p.last_name, 'Admin ' || p.first_name) as name,
            COALESCE(au.email, p.first_name || '@admin.local') as email,
            'active' as status,
            true as is_active
        FROM public.profiles p
        LEFT JOIN auth.users au ON au.id = p.id
        WHERE p.id = target_user_id
        ON CONFLICT (user_id) DO UPDATE SET
            status = 'active',
            is_active = true,
            updated_at = now();
    ELSE
        -- If demoting from admin, deactivate record in admins table
        UPDATE public.admins 
        SET 
            status = 'inactive',
            is_active = false,
            updated_at = now()
        WHERE user_id = target_user_id;
    END IF;

    -- Return success message
    RETURN json_build_object(
        'success', true,
        'message', CASE 
            WHEN make_admin THEN 'Usuário promovido a administrador com sucesso!'
            ELSE 'Privilégios de administrador removidos com sucesso!'
        END
    );
END;
$function$;