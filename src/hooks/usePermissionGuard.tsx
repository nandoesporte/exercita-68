import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminPermissionsContext } from '@/hooks/useAdminPermissionsContext';
import { toast } from '@/lib/toast-wrapper';
import type { Database } from '@/integrations/supabase/types';

type AdminPermission = Database['public']['Enums']['user_permission'];

export function usePermissionGuard(permission: AdminPermission, redirectTo = '/admin') {
  const { hasPermission, isLoading } = useAdminPermissionsContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !hasPermission(permission)) {
      toast('Você não tem permissão para acessar esta página');
      navigate(redirectTo);
    }
  }, [hasPermission, permission, isLoading, navigate, redirectTo]);

  return { hasPermission, isLoading };
}