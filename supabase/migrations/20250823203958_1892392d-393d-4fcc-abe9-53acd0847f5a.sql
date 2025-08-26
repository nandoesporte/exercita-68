-- Fix get_current_admin_id function to properly return the admin ID
CREATE OR REPLACE FUNCTION public.get_current_admin_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id 
  FROM public.admins 
  WHERE user_id = auth.uid()
  LIMIT 1;
$function$;

-- Fix get_user_admin_id function to properly return the admin_id for a user
CREATE OR REPLACE FUNCTION public.get_user_admin_id(_user_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT admin_id 
  FROM public.profiles 
  WHERE id = _user_id
  LIMIT 1;
$function$;