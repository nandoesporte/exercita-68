-- Update existing users that should have admin_id
-- Associate the recent users with the Mayara admin
UPDATE profiles 
SET admin_id = '25e55c3a-8c3e-4d05-ba12-e9e2e4cb264f'
WHERE admin_id IS NULL 
AND is_admin = false
AND id IN (
  '4ea13e85-a082-4a1e-8376-e873fb1ed9c8', -- teste2@saude.com
  'a0b9c6df-3659-4866-bb0a-9d376d53798c'  -- test@mayara.com
);

-- Fix search_path security issue for all functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  user_instance_id uuid;
  current_admin_id uuid;
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
  
  -- Try to get admin_id from user metadata (when admin creates users)
  current_admin_id := NULL;
  IF NEW.raw_user_meta_data->>'created_by_admin_id' IS NOT NULL THEN
    current_admin_id := (NEW.raw_user_meta_data->>'created_by_admin_id')::uuid;
  END IF;
  
  -- Create profile for the user with proper admin_id
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    avatar_url,
    instance_id,
    admin_id
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'avatar_url',
    user_instance_id,
    current_admin_id
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
    
    -- Update the profile to mark as admin (no admin_id for admins)
    UPDATE public.profiles 
    SET 
      is_admin = true,
      admin_id = NULL -- Admins don't have admin_id
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;