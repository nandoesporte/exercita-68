-- Transform nandoesporte1@gmail.com into super admin
-- First, update the profiles table to set is_admin = true
UPDATE public.profiles 
SET is_admin = true, updated_at = now()
WHERE id = 'a898ae66-1bd6-4835-a826-d77b1e0c8fbb';

-- Insert into admins table if not exists
INSERT INTO public.admins (
  user_id, 
  name, 
  email, 
  is_active, 
  status,
  created_at, 
  updated_at
)
SELECT 
  'a898ae66-1bd6-4835-a826-d77b1e0c8fbb',
  COALESCE(p.first_name || ' ' || p.last_name, 'Fernando Martins'),
  'nandoesporte1@gmail.com',
  true,
  'active',
  now(),
  now()
FROM public.profiles p 
WHERE p.id = 'a898ae66-1bd6-4835-a826-d77b1e0c8fbb'
AND NOT EXISTS (
  SELECT 1 FROM public.admins 
  WHERE user_id = 'a898ae66-1bd6-4835-a826-d77b1e0c8fbb'
);