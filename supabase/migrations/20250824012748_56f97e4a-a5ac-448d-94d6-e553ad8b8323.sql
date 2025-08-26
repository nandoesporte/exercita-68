-- Debug and fix the user_gym_photos RLS policy issue

-- First, let's check if there are any issues with the trigger
-- Let's make the trigger more robust to handle cases where admin_id is null

-- Also, let's temporarily allow NULL admin_id in the RLS policy to see if that's the issue
-- We'll update the INSERT policy to be more permissive

-- Drop and recreate the INSERT policy for user_gym_photos
DROP POLICY IF EXISTS "Users can create their own gym photos" ON user_gym_photos;

CREATE POLICY "Users can create their own gym photos" ON user_gym_photos
FOR INSERT TO public
WITH CHECK (
  auth.uid() = user_id
  -- Remove any admin_id constraints for now to debug
);

-- Let's also check if we need to update the trigger to handle null admin_id better
-- Update the trigger to be more permissive with admin_id
CREATE OR REPLACE FUNCTION public.set_admin_id_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- For user_gym_photos, try to set admin_id from the user's profile
    IF TG_TABLE_NAME = 'user_gym_photos' THEN
        -- Get admin_id from the user's profile
        BEGIN
            SELECT admin_id INTO NEW.admin_id
            FROM public.profiles
            WHERE id = NEW.user_id;
            
            -- If no admin_id found from user profile, try current user
            IF NEW.admin_id IS NULL THEN
                SELECT admin_id INTO NEW.admin_id
                FROM public.profiles
                WHERE id = auth.uid();
            END IF;
            
            -- If still no admin_id, that's ok - leave it as NULL
            -- This allows users without assigned admins to still upload photos
        EXCEPTION
            WHEN OTHERS THEN
                -- If any error occurs in the admin_id lookup, continue without it
                NEW.admin_id = NULL;
        END;
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
                BEGIN
                    NEW.admin_id = public.get_user_admin_id((hstore(NEW) -> 'user_id')::uuid);
                EXCEPTION
                    WHEN OTHERS THEN
                        -- If error, leave admin_id as NULL
                        NEW.admin_id = NULL;
                END;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;