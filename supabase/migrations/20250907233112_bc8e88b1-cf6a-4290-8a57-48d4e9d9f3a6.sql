-- Fix search path security issues for health token functions
-- These functions were flagged by the security linter

-- Fix the search path for existing functions
CREATE OR REPLACE FUNCTION public.store_encrypted_health_token(
    p_connection_id uuid,
    p_token_type text, -- 'access' or 'refresh'
    p_token_value text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    vault_secret_id uuid;
    connection_user_id uuid;
BEGIN
    -- Verify the connection belongs to the current user
    SELECT user_id INTO connection_user_id 
    FROM public.health_connections 
    WHERE id = p_connection_id AND user_id = auth.uid();
    
    IF connection_user_id IS NULL THEN
        RAISE EXCEPTION 'Connection not found or access denied';
    END IF;
    
    -- Store the token in the vault (encrypted at rest)
    INSERT INTO vault.secrets (name, description, secret)
    VALUES (
        format('health_%s_token_%s_%s', p_token_type, p_connection_id::text, extract(epoch from now())::text),
        format('Health %s token for connection %s', p_token_type, p_connection_id),
        p_token_value
    )
    RETURNING id INTO vault_secret_id;
    
    -- Update the connection with the vault reference
    IF p_token_type = 'access' THEN
        UPDATE public.health_connections 
        SET access_token_vault_id = vault_secret_id,
            access_token = NULL, -- Clear plaintext token
            token_last_rotated_at = now(),
            updated_at = now()
        WHERE id = p_connection_id;
    ELSIF p_token_type = 'refresh' THEN
        UPDATE public.health_connections 
        SET refresh_token_vault_id = vault_secret_id,
            refresh_token = NULL, -- Clear plaintext token
            token_last_rotated_at = now(),
            updated_at = now()
        WHERE id = p_connection_id;
    END IF;
    
    -- Log the action
    INSERT INTO public.health_token_audit_log (connection_id, user_id, action)
    VALUES (p_connection_id, auth.uid(), 'created');
    
    RETURN vault_secret_id;
END;
$$;

-- Fix the search path for get_encrypted_health_token function
CREATE OR REPLACE FUNCTION public.get_encrypted_health_token(
    p_connection_id uuid,
    p_token_type text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    vault_id uuid;
    token_value text;
    connection_user_id uuid;
BEGIN
    -- Verify the connection belongs to the current user or caller is admin
    SELECT user_id INTO connection_user_id 
    FROM public.health_connections 
    WHERE id = p_connection_id;
    
    IF connection_user_id IS NULL THEN
        RAISE EXCEPTION 'Connection not found';
    END IF;
    
    -- Only allow access if user owns the connection or is admin
    IF connection_user_id != auth.uid() AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    -- Get the vault ID
    IF p_token_type = 'access' THEN
        SELECT access_token_vault_id INTO vault_id 
        FROM public.health_connections 
        WHERE id = p_connection_id;
    ELSIF p_token_type = 'refresh' THEN
        SELECT refresh_token_vault_id INTO vault_id 
        FROM public.health_connections 
        WHERE id = p_connection_id;
    ELSE
        RAISE EXCEPTION 'Invalid token type';
    END IF;
    
    -- Retrieve from vault
    IF vault_id IS NOT NULL THEN
        SELECT decrypted_secret INTO token_value 
        FROM vault.decrypted_secrets 
        WHERE id = vault_id;
        
        -- Increment access count and log access
        UPDATE public.health_connections 
        SET token_access_count = token_access_count + 1,
            updated_at = now()
        WHERE id = p_connection_id;
        
        INSERT INTO public.health_token_audit_log (connection_id, user_id, action)
        VALUES (p_connection_id, connection_user_id, 'accessed');
    END IF;
    
    RETURN token_value;
END;
$$;

-- Fix the search path for revoke_health_tokens function
CREATE OR REPLACE FUNCTION public.revoke_health_tokens(p_connection_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    connection_user_id uuid;
    access_vault_id uuid;
    refresh_vault_id uuid;
BEGIN
    -- Verify the connection belongs to the current user
    SELECT user_id, access_token_vault_id, refresh_token_vault_id 
    INTO connection_user_id, access_vault_id, refresh_vault_id
    FROM public.health_connections 
    WHERE id = p_connection_id AND user_id = auth.uid();
    
    IF connection_user_id IS NULL THEN
        RAISE EXCEPTION 'Connection not found or access denied';
    END IF;
    
    -- Delete vault secrets
    IF access_vault_id IS NOT NULL THEN
        DELETE FROM vault.secrets WHERE id = access_vault_id;
    END IF;
    
    IF refresh_vault_id IS NOT NULL THEN
        DELETE FROM vault.secrets WHERE id = refresh_vault_id;
    END IF;
    
    -- Clear vault references and mark as revoked
    UPDATE public.health_connections 
    SET 
        access_token_vault_id = NULL,
        refresh_token_vault_id = NULL,
        access_token = NULL,
        refresh_token = NULL,
        status = 'disconnected',
        error_message = 'Tokens revoked for security',
        updated_at = now()
    WHERE id = p_connection_id;
    
    -- Log the revocation
    INSERT INTO public.health_token_audit_log (connection_id, user_id, action)
    VALUES (p_connection_id, auth.uid(), 'revoked');
    
    RETURN true;
END;
$$;

-- Fix the search path for the trigger function
CREATE OR REPLACE FUNCTION public.encrypt_health_tokens_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- If access_token is being set and not already encrypted
    IF NEW.access_token IS NOT NULL AND NEW.access_token_vault_id IS NULL THEN
        SELECT public.store_encrypted_health_token(NEW.id, 'access', NEW.access_token) 
        INTO NEW.access_token_vault_id;
        NEW.access_token = NULL; -- Clear plaintext
    END IF;
    
    -- If refresh_token is being set and not already encrypted
    IF NEW.refresh_token IS NOT NULL AND NEW.refresh_token_vault_id IS NULL THEN
        SELECT public.store_encrypted_health_token(NEW.id, 'refresh', NEW.refresh_token) 
        INTO NEW.refresh_token_vault_id;
        NEW.refresh_token = NULL; -- Clear plaintext
    END IF;
    
    RETURN NEW;
END;
$$;