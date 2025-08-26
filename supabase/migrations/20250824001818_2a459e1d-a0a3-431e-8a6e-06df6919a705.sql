-- Drop and recreate the trigger on workouts table to fix the user_id error
DROP TRIGGER IF EXISTS set_admin_id_workouts ON public.workouts;

-- Recreate the trigger with the updated function
CREATE TRIGGER set_admin_id_workouts
  BEFORE INSERT ON public.workouts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_admin_id_on_insert();