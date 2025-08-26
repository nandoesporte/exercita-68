
-- This function returns tables in the public schema where RLS is not enabled
create or replace function public.get_tables_without_rls()
returns table (
  table_name text,
  has_rls boolean,
  row_count bigint
)
language plpgsql
security definer
as $$
begin
  -- Check if user is admin
  if not (select is_admin from public.profiles where id = auth.uid()) then
    raise exception 'Only administrators can check RLS status';
  end if;

  return query
  SELECT
    tables.table_name::text,
    tables.rowsecurity AS has_rls,
    (SELECT COUNT(*) FROM information_schema.tables t WHERE t.table_schema = 'public' AND t.table_name = tables.table_name)::bigint AS row_count
  FROM
    pg_catalog.pg_tables tables
  WHERE
    tables.schemaname = 'public'
  ORDER BY
    tables.table_name;
end;
$$;
