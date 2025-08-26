-- Let's check if the trigger is working correctly
-- First, let's make sure the INSERT policy allows the user to create gym photos even without admin_id being set initially
-- The trigger should set it automatically

-- Update the set_admin_id_on_insert function to handle user_gym_photos correctly
CREATE OR REPLACE FUNCTION public.set_admin_id_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- For user_gym_photos, always set admin_id from the user's profile
    IF TG_TABLE_NAME = 'user_gym_photos' THEN
        -- Get admin_id from the user's profile
        SELECT admin_id INTO NEW.admin_id
        FROM public.profiles
        WHERE id = NEW.user_id;
        
        -- If no admin_id found, that's ok - user might not be assigned to an admin
        IF NEW.admin_id IS NULL THEN
            -- Get the admin_id from the user who is uploading (in case they're different)
            SELECT admin_id INTO NEW.admin_id
            FROM public.profiles
            WHERE id = auth.uid();
        END IF;
    ELSE
        -- For other tables, use existing logic
        IF TG_TABLE_NAME = 'workouts' THEN
            -- For workouts, only set admin_id if user is admin
            IF public.is_admin() AND NOT public.is_super_admin() THEN
                NEW.admin_id = public.get_current_admin_id();
            END IF;
        ELSE
            -- For other tables that have user_id field
            IF hstore(NEW) ? 'user_id' AND 
               (hstore(NEW) -> 'user_id')::uuid IS NOT NULL AND 
               NEW.admin_id IS NULL THEN
                NEW.admin_id = public.get_user_admin_id((hstore(NEW) -> 'user_id')::uuid);
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;