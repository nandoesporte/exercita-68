
-- This function allows admins to delete users
create or replace function public.admin_delete_user(user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Check if user is admin
  if not (select is_admin from public.profiles where id = auth.uid()) then
    raise exception 'Only administrators can delete users';
  end if;

  -- Delete the user from auth.users (this will cascade to profiles due to FK)
  perform supabase_auth.admin_delete_user(user_id);
end;
$$;
