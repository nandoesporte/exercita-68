-- Fix the handle_new_user function to properly handle instance_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, instance_id)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    CASE 
      WHEN new.raw_user_meta_data->>'instance_id' IS NOT NULL 
      THEN (new.raw_user_meta_data->>'instance_id')::uuid
      ELSE NULL
    END
  );
  RETURN new;
END;
$$;