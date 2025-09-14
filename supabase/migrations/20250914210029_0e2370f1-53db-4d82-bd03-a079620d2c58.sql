-- Promover usuário test3@mayara.com a admin
UPDATE public.profiles 
SET is_admin = true 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'test3@mayara.com'
);

-- Criar registro na tabela admins
INSERT INTO public.admins (user_id, name, email, status, is_active)
SELECT 
  u.id,
  COALESCE(p.first_name || ' ' || p.last_name, 'Admin') as name,
  u.email,
  'active' as status,
  true as is_active
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'test3@mayara.com'
  AND NOT EXISTS (SELECT 1 FROM public.admins WHERE user_id = u.id);