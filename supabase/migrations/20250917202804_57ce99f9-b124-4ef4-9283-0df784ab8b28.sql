-- Corrigir permissões faltantes para admins que não têm permissões atribuídas
-- Identificar admins sem permissões e dar permissões básicas

-- Primeiro, vamos ver quais admins não têm permissões
DO $$
DECLARE
    admin_record RECORD;
    basic_permissions text[] := ARRAY[
        'manage_workouts',
        'manage_exercises', 
        'manage_categories',
        'manage_users',
        'view_analytics'
    ];
    permission_name text;
BEGIN
    -- Para cada admin que não tem permissões, adicionar permissões básicas
    FOR admin_record IN 
        SELECT a.id, a.name, a.email 
        FROM admins a 
        LEFT JOIN admin_permissions ap ON a.id = ap.admin_id 
        WHERE a.is_active = true 
        AND ap.admin_id IS NULL
        AND a.user_id NOT IN (SELECT user_id FROM super_admins)
    LOOP
        RAISE NOTICE 'Adicionando permissões básicas para admin: % (%)', admin_record.name, admin_record.email;
        
        -- Adicionar permissões básicas para este admin
        FOREACH permission_name IN ARRAY basic_permissions
        LOOP
            INSERT INTO admin_permissions (admin_id, permission, granted_by)
            VALUES (admin_record.id, permission_name::user_permission, (SELECT user_id FROM super_admins LIMIT 1))
            ON CONFLICT (admin_id, permission) DO NOTHING;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Permissões básicas adicionadas para admins sem permissões';
END $$;