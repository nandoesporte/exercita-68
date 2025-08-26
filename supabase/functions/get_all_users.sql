
-- This function retrieves all users with their metadata and active status
create or replace function public.get_all_users()
returns table (
  id uuid,
  email text,
  raw_user_meta_data jsonb,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  banned_until timestamptz
)
language plpgsql
security definer
as $$
begin
  -- Check if user is admin
  if not (select is_admin from public.profiles where id = auth.uid()) then
    raise exception 'Only administrators can view all users';
  end if;

  return query
  select 
    u.id,
    u.email,
    u.raw_user_meta_data,
    u.created_at,
    u.last_sign_in_at,
    u.banned_until
  from auth.users u
  order by u.created_at desc;
end;
$$;
