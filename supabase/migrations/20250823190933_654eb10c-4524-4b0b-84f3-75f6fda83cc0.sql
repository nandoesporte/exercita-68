-- Create function to delete user (admin only)
CREATE OR REPLACE FUNCTION public.admin_delete_user(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if current user is admin or super admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can delete users';
  END IF;
  
  -- For regular admins, ensure they can only delete users from their admin group
  IF NOT is_super_admin() THEN
    -- Check if the user belongs to the current admin
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = user_id 
      AND admin_id = get_current_admin_id()
    ) THEN
      RAISE EXCEPTION 'You can only delete users from your own admin group';
    END IF;
  END IF;
  
  -- Delete user data in the correct order to respect foreign key constraints
  
  -- Delete user roles
  DELETE FROM public.user_roles WHERE user_roles.user_id = admin_delete_user.user_id;
  
  -- Delete user workout history
  DELETE FROM public.user_workout_history WHERE user_workout_history.user_id = admin_delete_user.user_id;
  
  -- Delete user gym photos
  DELETE FROM public.user_gym_photos WHERE user_gym_photos.user_id = admin_delete_user.user_id;
  
  -- Delete equipment based workouts
  DELETE FROM public.equipment_based_workouts WHERE equipment_based_workouts.user_id = admin_delete_user.user_id;
  
  -- Delete workout recommendations
  DELETE FROM public.workout_recommendations WHERE workout_recommendations.user_id = admin_delete_user.user_id;
  
  -- Delete orders and order items
  DELETE FROM public.order_items WHERE order_id IN (
    SELECT id FROM public.orders WHERE orders.user_id = admin_delete_user.user_id
  );
  DELETE FROM public.orders WHERE orders.user_id = admin_delete_user.user_id;
  
  -- Delete appointments
  DELETE FROM public.appointments WHERE appointments.user_id = admin_delete_user.user_id;
  
  -- Delete profile
  DELETE FROM public.profiles WHERE profiles.id = admin_delete_user.user_id;
  
  -- Finally delete from auth.users (this will cascade to other auth-related tables)
  DELETE FROM auth.users WHERE id = admin_delete_user.user_id;
  
END;
$function$