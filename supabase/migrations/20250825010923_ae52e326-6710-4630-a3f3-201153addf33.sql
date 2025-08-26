-- Create the toggle_user_admin_status function
CREATE OR REPLACE FUNCTION public.toggle_user_admin_status(target_user_id uuid, make_admin boolean)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

    -- Update admin status
    UPDATE public.profiles 
    SET 
        is_admin = make_admin,
        updated_at = now()
    WHERE id = target_user_id;

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