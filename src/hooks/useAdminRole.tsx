import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';

export function useAdminRole() {
  const { user } = useAuth();
  
  const { data: roleData, isLoading } = useQuery({
    queryKey: ['admin-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return { isAdmin: false, isSuperAdmin: false };
      
      console.log("Checking admin role for user:", user.id);
      
      // Use RPC functions to check roles
      const [adminCheck, superAdminCheck] = await Promise.all([
        supabase.rpc('is_admin'),
        supabase.rpc('is_super_admin')
      ]);
      
      if (adminCheck.error) {
        console.error("Error checking admin status:", adminCheck.error);
      }
      
      if (superAdminCheck.error) {
        console.error("Error checking super admin status:", superAdminCheck.error);
      }
      
      const isAdmin = Boolean(adminCheck.data);
      const isSuperAdmin = Boolean(superAdminCheck.data);
      
      console.log("Role check results:", { isAdmin, isSuperAdmin });
      
      return {
        isAdmin,
        isSuperAdmin
      };
    },
    enabled: !!user?.id,
    staleTime: 30000, // Cache for 30 seconds
  });
  
  return {
    isAdmin: roleData?.isAdmin || false,
    isSuperAdmin: roleData?.isSuperAdmin || false,
    isLoading,
  };
}