-- Fix the set_admin_id_on_insert function to work properly with workouts table
CREATE OR REPLACE FUNCTION public.set_admin_id_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Se o usuário é admin, definir seu próprio admin_id
    IF public.is_admin() AND NOT public.is_super_admin() THEN
        NEW.admin_id = public.get_current_admin_id();
    END IF;
    
    -- Se o usuário é comum e a tabela tem user_id (para tabelas como profiles, appointments, etc)
    IF TG_TABLE_NAME != 'workouts' AND NEW.user_id IS NOT NULL AND NEW.admin_id IS NULL THEN
        NEW.admin_id = public.get_user_admin_id(NEW.user_id);
    END IF;
    
    RETURN NEW;
END;
$function$;