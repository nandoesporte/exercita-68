import { ReactNode } from 'react';
import { useAdminPermissionsContext } from '@/hooks/useAdminPermissionsContext';
import { Card, CardContent } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type AdminPermission = Database['public']['Enums']['user_permission'];

interface PermissionGuardProps {
  permission: AdminPermission;
  children: ReactNode;
  fallback?: ReactNode;
  showFallback?: boolean;
}

export function PermissionGuard({ 
  permission, 
  children, 
  fallback, 
  showFallback = true 
}: PermissionGuardProps) {
  const { hasPermission, isLoading, isSuperAdmin, permissions } = useAdminPermissionsContext();

  // Show loading state while permissions are being fetched
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Debug log for permission checking
  console.log('PermissionGuard check:', { 
    permission, 
    hasPermission: hasPermission(permission),
    isSuperAdmin,
    userPermissions: permissions 
  });

  if (!hasPermission(permission)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (!showFallback) {
      return null;
    }

    return (
      <Card className="m-4">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <Lock className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            Acesso Negado
          </h3>
          <p className="text-sm text-muted-foreground">
            Você não tem permissão para acessar esta funcionalidade.
            Entre em contato com o administrador principal.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}