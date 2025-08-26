
-- This function allows admins to create new users
create or replace function public.admin_create_user(
  user_email text,
  user_password text,
  user_metadata jsonb DEFAULT '{}'::jsonb
)
returns json
language plpgsql
security definer
as $$
declare
  created_user json;
  instance_id uuid;
begin
  -- Check if user is admin
  if not (select is_admin from public.profiles where id = auth.uid()) then
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
  
  -- Use the admin API to create the user
  created_user := (
    select json_build_object(
      'id', id,
      'email', email,
      'user_metadata', raw_user_meta_data,
      'instance_id', instance_id
    )
    from auth.create_user(
      user_email,
      user_password,
      user_metadata
    )
  );
  
  return created_user;
end;
$$;
