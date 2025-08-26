-- Ajustar a tabela admins para suportar admins pendentes
-- Permitir user_id NULL temporariamente e adicionar campo de status

-- Primeiro, remover a constraint NOT NULL do user_id
ALTER TABLE public.admins ALTER COLUMN user_id DROP NOT NULL;

-- Adicionar campo para identificar admins pendentes
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Atualizar admins existentes para ter status ativo
UPDATE public.admins SET status = 'active' WHERE user_id IS NOT NULL;

-- Adicionar constraint para validar status
ALTER TABLE public.admins ADD CONSTRAINT valid_status 
CHECK (status IN ('pending', 'active', 'inactive'));

-- Atualizar a função create_admin_user para usar a nova estrutura
CREATE OR REPLACE FUNCTION public.create_admin_user(
    admin_email text,
    admin_name text,
    admin_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    new_admin_id uuid;
    result json;
BEGIN
    -- Verificar se o usuário atual é Super Admin
    IF NOT is_super_admin() THEN
        RETURN json_build_object('success', false, 'message', 'Apenas Super Admins podem criar administradores');
    END IF;

    -- Verificar se o email já existe em auth.users
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
        RETURN json_build_object('success', false, 'message', 'Este email já está em uso');
    END IF;
    
    -- Verificar se já existe um admin pendente com este email
    IF EXISTS (SELECT 1 FROM public.admins WHERE email = admin_email AND status = 'pending') THEN
        RETURN json_build_object('success', false, 'message', 'Já existe um admin pendente com este email');
    END IF;

    -- Criar registro na tabela admins (sem user_id por enquanto)
    INSERT INTO public.admins (
        name,
        email,
        user_id,
        status,
        is_active,
        created_by
    ) VALUES (
        admin_name,
        admin_email,
        NULL, -- Será preenchido quando o usuário fizer signup
        'pending',
        false,
        auth.uid()
    ) RETURNING id INTO new_admin_id;

    RETURN json_build_object(
        'success', true, 
        'message', 'Admin criado! Instrua ' || admin_email || ' a fazer signup para ativar a conta.',
        'admin_id', new_admin_id,
        'email', admin_email
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Erro ao criar admin: ' || SQLERRM);
END;
$$;

-- Atualizar função activate_admin_on_signup para usar o novo sistema
CREATE OR REPLACE FUNCTION public.activate_admin_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Verificar se existe um admin pendente com este email
    IF EXISTS (
        SELECT 1 FROM public.admins 
        WHERE email = NEW.email AND status = 'pending'
    ) THEN
        -- Atualizar o user_id do admin e ativar
        UPDATE public.admins 
        SET 
            user_id = NEW.id,
            status = 'active',
            is_active = true,
            updated_at = now()
        WHERE email = NEW.email AND status = 'pending';
        
        -- Criar role de admin
        INSERT INTO public.user_roles (
            user_id,
            role
        ) VALUES (
            NEW.id,
            'admin'
        ) ON CONFLICT (user_id, role) DO NOTHING;
        
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