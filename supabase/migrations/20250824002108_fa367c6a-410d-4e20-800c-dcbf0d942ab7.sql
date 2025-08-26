-- Force recreation of the function to ensure it's using the latest version
DROP FUNCTION IF EXISTS public.set_admin_id_on_insert() CASCADE;

CREATE OR REPLACE FUNCTION public.set_admin_id_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Only set admin_id for admin users, only on workouts table
    IF TG_TABLE_NAME = 'workouts' THEN
        -- For workouts, only set admin_id if user is admin
        IF public.is_admin() AND NOT public.is_super_admin() THEN
            NEW.admin_id = public.get_current_admin_id();
        END IF;
    ELSE
        -- For other tables that have user_id field
        -- Only check user_id if the column actually exists in the NEW record
        IF TG_TABLE_NAME != 'workouts' AND 
           hstore(NEW) ? 'user_id' AND 
           (hstore(NEW) -> 'user_id')::uuid IS NOT NULL AND 
           NEW.admin_id IS NULL THEN
            NEW.admin_id = public.get_user_admin_id((hstore(NEW) -> 'user_id')::uuid);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER set_admin_id_workouts
  BEFORE INSERT ON public.workouts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_admin_id_on_insert();