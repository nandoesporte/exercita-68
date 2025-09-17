-- Security Fix 1: Remove hardcoded admin authentication
-- Create secure admin credentials table
CREATE TABLE IF NOT EXISTS public.admin_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  salt text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_login_at timestamp with time zone,
  failed_attempts integer DEFAULT 0,
  locked_until timestamp with time zone
);

-- Enable RLS on admin credentials
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage admin credentials
CREATE POLICY "Only super admins can manage admin credentials"
ON public.admin_credentials
FOR ALL
USING (is_super_admin());

-- Security Fix 2: Update database functions to use proper search_path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.super_admins 
    WHERE user_id = auth.uid()
  );
END;
$$;

-- Security Fix 3: Create secure admin authentication function
CREATE OR REPLACE FUNCTION public.secure_admin_login(
  p_username text,
  p_password text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  admin_record public.admin_credentials%ROWTYPE;
  current_time timestamp with time zone := now();
  max_attempts integer := 5;
  lockout_duration interval := interval '30 minutes';
BEGIN
  -- Get admin credentials
  SELECT * INTO admin_record 
  FROM public.admin_credentials 
  WHERE username = p_username;
  
  -- Check if admin exists
  IF admin_record.id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Credenciais inválidas');
  END IF;
  
  -- Check if account is locked
  IF admin_record.locked_until IS NOT NULL AND admin_record.locked_until > current_time THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Conta bloqueada temporariamente. Tente novamente mais tarde.'
    );
  END IF;
  
  -- Verify password using crypt function
  IF NOT (admin_record.password_hash = crypt(p_password, admin_record.password_hash)) THEN
    -- Increment failed attempts
    UPDATE public.admin_credentials 
    SET 
      failed_attempts = failed_attempts + 1,
      locked_until = CASE 
        WHEN failed_attempts + 1 >= max_attempts THEN current_time + lockout_duration
        ELSE NULL
      END
    WHERE id = admin_record.id;
    
    RETURN json_build_object('success', false, 'message', 'Credenciais inválidas');
  END IF;
  
  -- Reset failed attempts and update last login
  UPDATE public.admin_credentials 
  SET 
    failed_attempts = 0,
    locked_until = NULL,
    last_login_at = current_time
  WHERE id = admin_record.id;
  
  RETURN json_build_object('success', true, 'message', 'Login realizado com sucesso');
END;
$$;

-- Security Fix 4: Create function to add admin credentials (super admin only)
CREATE OR REPLACE FUNCTION public.create_admin_credentials(
  p_username text,
  p_password text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  salt_value text;
  password_hash text;
BEGIN
  -- Check if caller is super admin
  IF NOT is_super_admin() THEN
    RETURN json_build_object('success', false, 'message', 'Acesso negado');
  END IF;
  
  -- Generate salt and hash password
  salt_value := gen_salt('bf', 10);
  password_hash := crypt(p_password, salt_value);
  
  -- Insert credentials
  INSERT INTO public.admin_credentials (username, password_hash, salt)
  VALUES (p_username, password_hash, salt_value);
  
  RETURN json_build_object('success', true, 'message', 'Credenciais de admin criadas com sucesso');
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('success', false, 'message', 'Nome de usuário já existe');
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', 'Erro interno do servidor');
END;
$$;

-- Security Fix 5: Fix RLS policies for critical tables
-- Fix health_connections RLS (was too permissive for admins)
DROP POLICY IF EXISTS "Admins can view all health connections" ON public.health_connections;
CREATE POLICY "Super admins can view all health connections"
ON public.health_connections
FOR SELECT
USING (is_super_admin());

-- Fix device_keys RLS (was too permissive for admins)  
DROP POLICY IF EXISTS "Admins can view all device keys" ON public.device_keys;
CREATE POLICY "Super admins can view all device keys"
ON public.device_keys
FOR SELECT
USING (is_super_admin());

-- Fix admin_permissions to prevent unauthorized access
DROP POLICY IF EXISTS "Only admins can view admin permissions" ON public.admin_permissions;
CREATE POLICY "Super admins can manage all permissions"
ON public.admin_permissions
FOR ALL
USING (is_super_admin());

CREATE POLICY "Admins can view own permissions"
ON public.admin_permissions
FOR SELECT
USING (
  admin_id IN (
    SELECT id FROM public.admins WHERE user_id = auth.uid()
  )
);

-- Security Fix 6: Add audit logging table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  table_name text,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only super admins can view audit logs
CREATE POLICY "Only super admins can view audit logs"
ON public.admin_audit_log
FOR ALL
USING (is_super_admin());