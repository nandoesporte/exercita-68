-- Drop the existing function and recreate it with fixed column reference
DROP FUNCTION IF EXISTS public.debug_get_all_users();

-- Recreate the function with proper column aliases to avoid ambiguity
CREATE OR REPLACE FUNCTION public.debug_get_all_users()
 RETURNS TABLE(user_id uuid, email text, raw_user_meta_data jsonb, created_at timestamp with time zone, last_sign_in_at timestamp with time zone, banned_until timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user is admin - specify the table alias to avoid ambiguity
  IF NOT (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can view all users';
  END IF;

  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.email,
    u.raw_user_meta_data,
    u.created_at,
    u.last_sign_in_at,
    u.banned_until
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$function$