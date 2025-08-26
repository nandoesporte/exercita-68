import { useContext } from 'react';
import { AdminPermissionsContext } from '@/contexts/admin/AdminPermissionsContext';
import { useAdminRole } from '@/hooks/useAdminRole';

export function useAdminPermissionsContext() {
  const { isSuperAdmin, isAdmin } = useAdminRole();
  
  // Always call useContext, never conditionally
  const context = useContext(AdminPermissionsContext);
  
  // If context is undefined, provide fallback values
  if (context === undefined) {
    console.warn('AdminPermissions context not available, using fallback');
    
    // Fallback when context is not available
    return {
      hasPermission: (permission: string) => isSuperAdmin, // Super admins get all permissions as fallback
      isLoading: false,
      permissions: [],
      adminId: null,
      isSuperAdmin,
      isAdmin,
    };
  }
  
  // Return the actual context values
  return {
    hasPermission: context.hasPermission,
    isLoading: context.isLoading,
    permissions: context.permissions,
    adminId: context.adminId,
    isSuperAdmin: context.isSuperAdmin,
    isAdmin: context.isAdmin,
  };
}