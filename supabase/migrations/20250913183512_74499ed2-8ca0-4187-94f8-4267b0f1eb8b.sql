-- Atribuir usuários não atribuídos ao admin logado kelly Martins (ID: 2ba5a6b8-a1e1-4f99-8a71-1378432b88cb)
UPDATE profiles 
SET admin_id = '2ba5a6b8-a1e1-4f99-8a71-1378432b88cb'
WHERE admin_id IS NULL 
AND is_admin = false 
AND created_at > '2025-08-01';