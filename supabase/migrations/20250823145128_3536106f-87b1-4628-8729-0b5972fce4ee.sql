-- Fix the admin activation by adding the logic to the existing handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  user_instance_id uuid;
BEGIN
  -- Extract instance_id from user metadata or use a new UUID if not found
  IF NEW.raw_user_meta_data->>'instance_id' IS NOT NULL THEN
    user_instance_id := (NEW.raw_user_meta_data->>'instance_id')::uuid;
  ELSE
    user_instance_id := gen_random_uuid();
    
    -- Update the user with the new instance_id
    UPDATE auth.users
    SET raw_user_meta_data = 
      jsonb_set(raw_user_meta_data, '{instance_id}', to_jsonb(user_instance_id::text))
    WHERE id = NEW.id;
  END IF;
  
  -- Create profile for the user
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    avatar_url,
    instance_id
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'avatar_url',
    user_instance_id
  );
  
  -- Check if this user is a pending admin and activate them
  IF EXISTS (
    SELECT 1 FROM public.admins 
    WHERE email = NEW.email AND status = 'pending'
  ) THEN
    -- Update the admin record
    UPDATE public.admins 
    SET 
      user_id = NEW.id,
      status = 'active',
      is_active = true,
      updated_at = now()
    WHERE email = NEW.email AND status = 'pending';
    
    -- Create admin role for the user
    INSERT INTO public.user_roles (
      user_id,
      role
    ) VALUES (
      NEW.id,
      'admin'
    ) ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Update the profile to mark as admin
    UPDATE public.profiles 
    SET is_admin = true
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;