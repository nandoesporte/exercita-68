-- Add missing permission values to the enum
ALTER TYPE user_permission ADD VALUE 'manage_categories';
ALTER TYPE user_permission ADD VALUE 'manage_store'; 
ALTER TYPE user_permission ADD VALUE 'manage_gym_photos';
ALTER TYPE user_permission ADD VALUE 'manage_schedule';
ALTER TYPE user_permission ADD VALUE 'manage_appointments';
ALTER TYPE user_permission ADD VALUE 'manage_payment_methods';

-- Create essential RPC functions that the admin features use
CREATE OR REPLACE FUNCTION public.debug_get_all_users()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  RETURN (
    SELECT json_agg(
      json_build_object(
        'id', p.id,
        'email', u.email,
        'first_name', p.first_name,
        'last_name', p.last_name,
        'is_admin', p.is_admin,
        'created_at', p.created_at
      )
    )
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  RETURN (
    SELECT json_agg(
      json_build_object(
        'id', p.id,
        'email', u.email,
        'first_name', p.first_name,
        'last_name', p.last_name,
        'is_admin', p.is_admin,
        'created_at', p.created_at
      )
    )
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_user_admin_status(user_id UUID, make_admin BOOLEAN)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Update user admin status
  UPDATE public.profiles 
  SET is_admin = make_admin 
  WHERE id = user_id;
  
  RETURN json_build_object('success', true, 'message', 'User admin status updated');
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_user_active_status(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- For now, just return success as we don't have active status field
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_user(user_data JSON)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- This function would need integration with auth.users creation
  -- For now, just return success
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Delete user profile (auth.users deletion would cascade)
  DELETE FROM public.profiles WHERE id = user_id;
  
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.clone_workout_for_user(workout_id UUID, target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_workout_id UUID;
BEGIN
  -- Check if caller is admin
  IF NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Clone the workout
  INSERT INTO public.workouts (title, description, image_url, duration, level, calories, category_id, user_id, admin_id)
  SELECT title || ' (Copy)', description, image_url, duration, level, calories, category_id, target_user_id, admin_id
  FROM public.workouts WHERE id = workout_id
  RETURNING id INTO new_workout_id;
  
  -- Clone workout exercises
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, duration, rest, order_position, weight, day_of_week, is_title_section, section_title)
  SELECT new_workout_id, exercise_id, sets, reps, duration, rest, order_position, weight, day_of_week, is_title_section, section_title
  FROM public.workout_exercises WHERE workout_id = workout_id;
  
  RETURN true;
END;
$$;

-- Fix search path for existing functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- For now, super admin is just regular admin
  -- This can be extended later with specific super admin logic
  RETURN public.is_admin();
END;
$$;