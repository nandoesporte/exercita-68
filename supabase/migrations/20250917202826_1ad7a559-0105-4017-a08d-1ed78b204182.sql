-- Adicionar constraint única para admin_permissions e corrigir permissões faltantes
ALTER TABLE admin_permissions ADD CONSTRAINT admin_permissions_admin_id_permission_key UNIQUE (admin_id, permission);

-- Adicionar permissões básicas para admins que não têm permissões
INSERT INTO admin_permissions (admin_id, permission, granted_by)
SELECT 
    a.id as admin_id,
    perm.permission,
    (SELECT user_id FROM super_admins LIMIT 1) as granted_by
FROM admins a
CROSS JOIN (
    VALUES 
    ('manage_workouts'::user_permission),
    ('manage_exercises'::user_permission), 
    ('manage_categories'::user_permission),
    ('manage_users'::user_permission),
    ('view_analytics'::user_permission)
) AS perm(permission)
LEFT JOIN admin_permissions ap ON a.id = ap.admin_id AND ap.permission = perm.permission
WHERE a.is_active = true 
    AND a.user_id NOT IN (SELECT user_id FROM super_admins)
    AND ap.admin_id IS NULL;