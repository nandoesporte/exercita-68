-- Fix search_path security issue in admin_create_user function
create or replace function public.admin_create_user(
  user_email text,
  user_password text,
  user_metadata jsonb DEFAULT '{}'::jsonb
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  created_user_id uuid;
  instance_id uuid;
  encrypted_password text;
begin
  -- Check if user is admin
  if not (select is_admin from profiles where id = auth.uid()) then
    raise exception 'Only administrators can create users';
  end if;
  
  -- Generate an instance_id for the user
  instance_id := gen_random_uuid();
  
  -- Add instance_id to user metadata
  user_metadata := jsonb_set(
    coalesce(user_metadata, '{}'::jsonb),
    '{instance_id}',
    to_jsonb(instance_id::text)
  );
  
  -- Generate a new user ID
  created_user_id := gen_random_uuid();
  
  -- Encrypt the password using Supabase's crypt function
  encrypted_password := crypt(user_password, gen_salt('bf'));
  
  -- Insert directly into auth.users with email_confirmed = true
  insert into auth.users (
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
  ) values (
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
  
  return json_build_object(
    'id', created_user_id,
    'email', user_email,
    'user_metadata', user_metadata,
    'instance_id', instance_id,
    'email_confirmed', true
  );
end;
$$;