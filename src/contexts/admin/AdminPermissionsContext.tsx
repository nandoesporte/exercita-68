import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { useAdminRole } from '@/hooks/useAdminRole';
import type { Database } from '@/integrations/supabase/types';

type AdminPermission = Database['public']['Enums']['user_permission'];

interface AdminPermissionsContextType {
  permissions: AdminPermission[];
  hasPermission: (permission: AdminPermission) => boolean;
  isLoading: boolean;
  adminId: string | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

export const AdminPermissionsContext = createContext<AdminPermissionsContextType | undefined>(undefined);

export function AdminPermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isAdmin, isSuperAdmin, isLoading: roleLoading } = useAdminRole();
  const [adminId, setAdminId] = useState<string | null>(null);

  // Fetch current admin ID
  const { data: adminData } = useQuery({
    queryKey: ['current-admin-id', user?.id],
    queryFn: async () => {
      console.log('AdminPermissionsContext - Fetching admin ID for user:', user?.id, 'isAdmin:', isAdmin);
      if (!user?.id || !isAdmin) return null;
      
      const { data, error } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (error) {
        console.error('Error fetching admin ID:', error);
        return null;
      }
      
      console.log('AdminPermissionsContext - Admin data fetched:', data);
      return data;
    },
    enabled: !!user?.id && isAdmin,
  });

  // Fetch admin permissions
  const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['admin-permissions', adminData?.id, isSuperAdmin],
    queryFn: async () => {
      console.log('AdminPermissionsContext - Fetching permissions. isSuperAdmin:', isSuperAdmin, 'adminData:', adminData);
      
      if (isSuperAdmin) {
        console.log('AdminPermissionsContext - Returning super admin permissions');
        // Return all possible permissions for Super Admin
        return [
          'manage_workouts', 
          'manage_exercises', 
          'manage_categories', 
          'manage_products', 
          'manage_store',
          'manage_gym_photos', 
          'manage_schedule', 
          'manage_appointments', 
          'manage_payment_methods'
        ] as AdminPermission[];
      }
      
      if (!adminData?.id) {
        console.log('AdminPermissionsContext - No admin ID, returning empty permissions');
        return [];
      }
      
      console.log('AdminPermissionsContext - Fetching permissions for admin ID:', adminData.id);
      
      const { data, error } = await supabase
        .from('admin_permissions')
        .select('permission')
        .eq('admin_id', adminData.id);
        
      if (error) {
        console.error('Error fetching permissions:', error);
        return [];
      }
      
      console.log('AdminPermissionsContext - Permissions fetched:', data);
      return data.map(p => p.permission);
    },
    enabled: (!!adminData?.id || isSuperAdmin) && isAdmin,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  useEffect(() => {
    console.log('AdminPermissionsContext - Setting adminId. adminData:', adminData, 'isSuperAdmin:', isSuperAdmin);
    if (adminData?.id) {
      setAdminId(adminData.id);
      console.log('AdminPermissionsContext - adminId set to:', adminData.id);
    } else if (isSuperAdmin) {
      setAdminId('super_admin');
      console.log('AdminPermissionsContext - adminId set to: super_admin');
    } else {
      setAdminId(null);
      console.log('AdminPermissionsContext - adminId set to: null');
    }
  }, [adminData?.id, isSuperAdmin]);

  const hasPermission = (permission: AdminPermission): boolean => {
    // During loading, return false to prevent premature access
    if (roleLoading || permissionsLoading) {
      console.log('AdminPermissionsContext - hasPermission returning false due to loading:', { roleLoading, permissionsLoading });
      return false;
    }
    
    // Super admin always has all permissions
    if (isSuperAdmin) {
      console.log('AdminPermissionsContext - hasPermission returning true for super admin');
      return true;
    }
    
    // Regular admins need explicit permissions
    const hasIt = permissions.includes(permission);
    console.log('AdminPermissionsContext - hasPermission check:', { permission, permissions, hasIt });
    return hasIt;
  };

  const value: AdminPermissionsContextType = {
    permissions,
    hasPermission,
    isLoading: roleLoading || permissionsLoading,
    adminId,
    isSuperAdmin,
    isAdmin,
  };

  return (
    <AdminPermissionsContext.Provider value={value}>
      {children}
    </AdminPermissionsContext.Provider>
  );
}

export function useAdminPermissions() {
  const context = useContext(AdminPermissionsContext);
  if (context === undefined) {
    throw new Error('useAdminPermissions must be used within an AdminPermissionsProvider');
  }
  return context;
}