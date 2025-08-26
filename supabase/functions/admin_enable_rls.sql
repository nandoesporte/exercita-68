
-- This function allows administrators to enable RLS on a specified table
create or replace function public.admin_enable_rls(table_name text)
returns void
language plpgsql
security definer
as $$
begin
  -- Check if user is admin
  if not (select is_admin from public.profiles where id = auth.uid()) then
    raise exception 'Only administrators can enable RLS on tables';
  end if;

  -- Enable RLS on the specified table
  execute format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
end;
$$;
