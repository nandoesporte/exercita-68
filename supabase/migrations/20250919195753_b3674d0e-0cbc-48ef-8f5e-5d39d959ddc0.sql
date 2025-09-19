-- Drop the existing function first
drop function if exists public.admin_delete_user(uuid);

-- Create the updated admin_delete_user function to handle foreign key constraints
create or replace function public.admin_delete_user(user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Check if user is admin
  if not (select is_admin from public.profiles where id = auth.uid()) then
    raise exception 'Only administrators can delete users';
  end if;

  -- Delete related data first to avoid foreign key constraint violations
  -- Delete user appointments
  delete from public.appointments where user_id = admin_delete_user.user_id;
  
  -- Delete user workout history
  delete from public.user_workout_history where user_id = admin_delete_user.user_id;
  
  -- Delete user orders
  delete from public.orders where user_id = admin_delete_user.user_id;
  
  -- Delete user gym photos
  delete from public.user_gym_photos where user_id = admin_delete_user.user_id;
  
  -- Delete user running plans
  delete from public.running_plans where user_id = admin_delete_user.user_id;
  
  -- Delete user health data
  delete from public.health_data where user_id = admin_delete_user.user_id;
  
  -- Delete user health connections
  delete from public.health_connections where user_id = admin_delete_user.user_id;
  
  -- Delete user health consents
  delete from public.health_consents where user_id = admin_delete_user.user_id;
  
  -- Delete user roles
  delete from public.user_roles where user_id = admin_delete_user.user_id;
  
  -- Delete workout recommendations for this user
  delete from public.workout_recommendations where user_id = admin_delete_user.user_id;
  
  -- Delete equipment based workouts
  delete from public.equipment_based_workouts where user_id = admin_delete_user.user_id;
  
  -- Delete device keys
  delete from public.device_keys where user_id = admin_delete_user.user_id;
  
  -- Delete the user profile
  delete from public.profiles where id = admin_delete_user.user_id;
  
  -- Finally, delete from auth.users
  delete from auth.users where id = admin_delete_user.user_id;
end;
$$;