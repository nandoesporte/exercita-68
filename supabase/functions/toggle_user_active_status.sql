
-- This function toggles the active status of a user by setting or removing the banned_until date
create or replace function public.toggle_user_active_status(user_id uuid, is_active boolean)
returns void
language plpgsql
security definer
as $$
begin
  -- Check if user is admin
  if not (select is_admin from public.profiles where id = auth.uid()) then
    raise exception 'Only administrators can modify user status';
  end if;

  if is_active then
    -- Activate user by removing ban
    update auth.users
    set banned_until = null
    where id = user_id;
  else
    -- Deactivate user by setting a far future ban date (effectively permanent)
    update auth.users
    set banned_until = '2099-12-31'::timestamp with time zone
    where id = user_id;
  end if;
end;
$$;
