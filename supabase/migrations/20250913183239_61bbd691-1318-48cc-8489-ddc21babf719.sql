-- Update the handle_new_user function to properly assign users to admins
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  admin_id_to_assign uuid;
BEGIN
  -- Check if admin_id was passed in metadata
  IF new.raw_user_meta_data->>'created_by_admin_id' IS NOT NULL THEN
    admin_id_to_assign := (new.raw_user_meta_data->>'created_by_admin_id')::uuid;
  ELSE
    admin_id_to_assign := NULL;
  END IF;

  INSERT INTO public.profiles (id, first_name, last_name, admin_id, instance_id)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    admin_id_to_assign,
    CASE 
      WHEN new.raw_user_meta_data->>'instance_id' IS NOT NULL 
      THEN (new.raw_user_meta_data->>'instance_id')::uuid
      ELSE NULL
    END
  );
  RETURN new;
END;
$$;