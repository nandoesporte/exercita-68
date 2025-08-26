-- Função para criar novos administradores com segurança
CREATE OR REPLACE FUNCTION public.create_admin_user(
    admin_email text,
    admin_name text,
    admin_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    new_user_id uuid;
    result json;
BEGIN
    -- Verificar se o usuário atual é Super Admin
    IF NOT is_super_admin() THEN
        RETURN json_build_object('success', false, 'message', 'Apenas Super Admins podem criar administradores');
    END IF;

    -- Verificar se o email já existe
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
        RETURN json_build_object('success', false, 'message', 'Este email já está em uso');
    END IF;

    -- Gerar um ID para o novo usuário
    new_user_id := gen_random_uuid();
    
    -- Inserir na tabela auth.users (simulando criação, mas na prática usaremos invitation)
    -- Como não podemos criar usuários diretamente, vamos criar um registro admin pendente
    -- e instruir o usuário a fazer signup com este email
    
    -- Criar registro na tabela admins
    INSERT INTO public.admins (
        user_id,
        name,
        email,
        is_active,
        created_by
    ) VALUES (
        new_user_id,
        admin_name,
        admin_email,
        false, -- Inativo até completar o signup
        auth.uid()
    );

    -- Criar role de admin (será ativada quando o usuário fizer signup)
    INSERT INTO public.user_roles (
        user_id,
        role
    ) VALUES (
        new_user_id,
        'admin'
    );

    RETURN json_build_object(
        'success', true, 
        'message', 'Admin criado. O usuário deve fazer signup com o email ' || admin_email,
        'user_id', new_user_id,
        'email', admin_email
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Erro ao criar admin: ' || SQLERRM);
END;
$$;

-- Função para ativar admin após signup
CREATE OR REPLACE FUNCTION public.activate_admin_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Verificar se existe um admin pendente com este email
    IF EXISTS (
        SELECT 1 FROM public.admins 
        WHERE email = NEW.email AND is_active = false
    ) THEN
        -- Atualizar o user_id do admin e ativar
        UPDATE public.admins 
        SET 
            user_id = NEW.id,
            is_active = true,
            updated_at = now()
        WHERE email = NEW.email AND is_active = false;
        
        -- Atualizar o user_id na tabela user_roles
        UPDATE public.user_roles 
        SET user_id = NEW.id
        WHERE user_id IN (
            SELECT user_id FROM public.admins 
            WHERE email = NEW.email
        );
        
        -- Criar perfil para o admin
        INSERT INTO public.profiles (
            id,
            first_name,
            last_name,
            avatar_url
        ) VALUES (
            NEW.id,
            NEW.raw_user_meta_data->>'first_name',
            NEW.raw_user_meta_data->>'last_name',
            NEW.raw_user_meta_data->>'avatar_url'
        )
        ON CONFLICT (id) DO UPDATE SET
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            avatar_url = EXCLUDED.avatar_url;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Criar trigger para ativar admins no signup
DROP TRIGGER IF EXISTS activate_admin_on_signup_trigger ON auth.users;
CREATE TRIGGER activate_admin_on_signup_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.activate_admin_on_signup();