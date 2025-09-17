-- Find and fix the remaining functions without search_path
-- Check which functions need search_path fix by looking at all functions

-- Fix admin_create_user function (overload)
CREATE OR REPLACE FUNCTION public.admin_create_user(user_data json)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Fix admin_delete_user function
CREATE OR REPLACE FUNCTION public.admin_delete_user(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Fix clone_workout_for_user function
CREATE OR REPLACE FUNCTION public.clone_workout_for_user(workout_id uuid, target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Fix debug_get_all_users function
CREATE OR REPLACE FUNCTION public.debug_get_all_users()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Fix get_all_users function  
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Fix get_tables_without_rls function
CREATE OR REPLACE FUNCTION public.get_tables_without_rls()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result json;
BEGIN
  -- Check if user is admin
  IF NOT is_admin() THEN
    RETURN json_build_object('success', false, 'message', 'Access denied');
  END IF;

  SELECT json_agg(
    json_build_object(
      'table_name', schemaname || '.' || tablename,
      'rls_enabled', rowsecurity
    )
  )
  INTO result
  FROM pg_tables t
  LEFT JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public'
  AND (c.relrowsecurity IS FALSE OR c.relrowsecurity IS NULL);

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- Fix admin_enable_rls function
CREATE OR REPLACE FUNCTION public.admin_enable_rls(p_table_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin() THEN
    RETURN json_build_object('success', false, 'message', 'Access denied');
  END IF;

  -- Enable RLS on the table
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', p_table_name);

  RETURN json_build_object('success', true, 'message', 'RLS enabled for ' || p_table_name);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;