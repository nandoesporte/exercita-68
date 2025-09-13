-- Drop the existing function first
DROP FUNCTION IF EXISTS public.toggle_user_active_status(uuid);

-- Recreate the function with correct implementation
CREATE OR REPLACE FUNCTION public.toggle_user_active_status(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_status boolean;
BEGIN
  -- Check if caller is admin
  IF NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can modify user status';
  END IF;
  
  -- Get current status (assume active if banned_until is null or in the past)
  SELECT (banned_until IS NULL OR banned_until < now()) 
  INTO current_status
  FROM auth.users 
  WHERE id = target_user_id;
  
  IF current_status THEN
    -- User is currently active, so deactivate by setting banned_until
    UPDATE auth.users
    SET banned_until = '2099-12-31'::timestamp with time zone
    WHERE id = target_user_id;
  ELSE
    -- User is currently inactive, so activate by removing ban
    UPDATE auth.users
    SET banned_until = NULL
    WHERE id = target_user_id;
  END IF;
  
  RETURN NOT current_status; -- Return new status
END;
$$;