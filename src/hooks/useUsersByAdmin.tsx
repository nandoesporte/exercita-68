import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminRole } from './useAdminRole';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  admin_id: string | null;
  created_at: string;
  avatar_url: string | null;
  email?: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  userCount: number;
}

export function useUsersByAdmin() {
  const { isSuperAdmin, isAdmin } = useAdminRole();

  // Fetch current admin ID first
  const { data: adminData } = useQuery({
    queryKey: ['current-admin-id'],
    queryFn: async () => {
      if (isSuperAdmin || !isAdmin) return null;
      
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) return null;
      
      const { data, error } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', currentUser.user.id)
        .single();
        
      if (error) {
        console.error('Error fetching admin ID:', error);
        return null;
      }
      
      return data;
    },
    enabled: isAdmin && !isSuperAdmin,
  });

  const { data: adminUsers, isLoading: isLoadingAdmins } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: admins, error } = await supabase
        .from('admins')
        .select('id, name, email')
        .eq('status', 'active');

      if (error) throw error;

      return admins as AdminUser[];
    },
    enabled: isSuperAdmin,
  });

  const { data: userProfiles, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users-by-admin', isSuperAdmin ? 'all' : adminData?.id],
    queryFn: async () => {
      console.log('Fetching users - isSuperAdmin:', isSuperAdmin, 'adminData:', adminData);
      
      if (isSuperAdmin) {
        // Super admin gets all users with email data
        const { data: usersData, error: usersError } = await supabase.rpc('get_all_users');
        if (usersError) throw usersError;

        // Get all profiles data
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, admin_id, created_at, avatar_url');

        if (profilesError) throw profilesError;

        // Combine users and profiles data
        const combinedData = profiles.map(profile => {
          const userData = (usersData as any[])?.find((u: any) => u.id === profile.id);
          return {
            ...profile,
            email: userData?.email || null
          };
        });

        return combinedData as UserProfile[];
      } else if (isAdmin && adminData?.id) {
        // Regular admin gets only their users (no email access for security)
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, admin_id, created_at, avatar_url')
          .eq('admin_id', adminData.id)
          .neq('is_admin', true); // Exclude other admins from the list

        if (profilesError) throw profilesError;

        console.log('Fetched profiles for admin:', profiles.length, 'profiles');
        // For regular admins, we don't expose email addresses for security
        return profiles.map(profile => ({
          ...profile,
          email: `${profile.first_name || 'usuário'}@***` // Masked email
        })) as UserProfile[];
      }
      
      return [];
    },
    enabled: (isSuperAdmin || (isAdmin && !!adminData?.id)),
  });

  const getUsersByAdmin = (adminId?: string) => {
    if (!userProfiles) return [];
    
    if (adminId) {
      return userProfiles.filter(user => user.admin_id === adminId);
    }
    
    return userProfiles;
  };

  const getAdminsWithUserCount = () => {
    if (!adminUsers || !userProfiles) return [];
    
    return adminUsers.map(admin => ({
      ...admin,
      userCount: userProfiles.filter(user => user.admin_id === admin.id).length
    }));
  };

  return {
    adminUsers: getAdminsWithUserCount(),
    userProfiles,
    getUsersByAdmin,
    isLoading: isLoadingAdmins || isLoadingUsers,
    isSuperAdmin,
    isAdmin
  };
}