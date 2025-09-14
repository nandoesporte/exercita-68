-- Enable pgcrypto extension for password encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fix admin_create_user function to work with pgcrypto extension
CREATE OR REPLACE FUNCTION public.admin_create_user(
  user_email text,
  user_password text,
  user_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  created_user_id uuid;
  instance_id uuid;
  encrypted_password text;
BEGIN
  -- Check if user is admin
  IF NOT (SELECT is_admin FROM profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can create users';
  END IF;
  
  -- Generate an instance_id for the user
  instance_id := gen_random_uuid();
  
  -- Add instance_id to user metadata
  user_metadata := jsonb_set(
    COALESCE(user_metadata, '{}'::jsonb),
    '{instance_id}',
    to_jsonb(instance_id::text)
  );
  
  -- Generate a new user ID
  created_user_id := gen_random_uuid();
  
  -- Encrypt the password using pgcrypto extension
  encrypted_password := crypt(user_password, gen_salt('bf'));
  
  -- Insert directly into auth.users with email_confirmed = true
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    phone_confirmed_at,
    confirmation_sent_at,
    recovery_sent_at,
    email_change_sent_at,
    raw_user_meta_data,
    raw_app_meta_data,
    is_super_admin,
    role,
    created_at,
    updated_at,
    instance_id,
    aud,
    confirmed_at
  ) VALUES (
    created_user_id,
    user_email,
    encrypted_password,
    now(),  -- email_confirmed_at - this makes the user confirmed immediately
    null,
    now(),
    null,
    null,
    user_metadata,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    false,
    'authenticated',
    now(),
    now(),
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    now()  -- confirmed_at - also set this for full confirmation
  );
  
  RETURN json_build_object(
    'id', created_user_id,
    'email', user_email,
    'user_metadata', user_metadata,
    'instance_id', instance_id,
    'email_confirmed', true
  );
END;
$$;