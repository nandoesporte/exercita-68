-- Melhorar a função get_all_users para incluir dados dos profiles diretamente
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if user is admin
  IF NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can view all users';
  END IF;

  -- Return users with profile data in a single query
  RETURN (
    SELECT json_agg(user_data)
    FROM (
      SELECT json_build_object(
        'id', u.id,
        'email', u.email,
        'raw_user_meta_data', u.raw_user_meta_data,
        'created_at', u.created_at,
        'last_sign_in_at', u.last_sign_in_at,
        'banned_until', u.banned_until,
        'first_name', COALESCE(p.first_name, u.raw_user_meta_data->>'first_name'),
        'last_name', COALESCE(p.last_name, u.raw_user_meta_data->>'last_name'),
        'is_admin', COALESCE(p.is_admin, false)
      ) AS user_data
      FROM auth.users u
      INNER JOIN public.profiles p ON p.id = u.id
      ORDER BY u.created_at DESC
    ) AS ordered_users
  );
END;
$$;