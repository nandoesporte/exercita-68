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
      console.log('Fetching admin ID - isSuperAdmin:', isSuperAdmin, 'isAdmin:', isAdmin);
      
      if (isSuperAdmin || !isAdmin) return null;
      
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        console.log('No current user found');
        return null;
      }
      
      console.log('Current user ID:', currentUser.user.id);
      
      const { data, error } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', currentUser.user.id)
        .single();
        
      if (error) {
        console.error('Error fetching admin ID:', error);
        return null;
      }
      
      console.log('Found admin data:', data);
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
      console.log('Query enabled conditions:', { isSuperAdmin, isAdmin, adminDataId: adminData?.id });
      
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
        console.log('Fetching profiles for admin ID:', adminData.id);
        
        // Regular admin gets their assigned users AND unassigned users
        const [assignedUsers, unassignedUsers] = await Promise.all([
          // Get users assigned to this admin
          supabase
            .from('profiles')
            .select('id, first_name, last_name, admin_id, created_at, avatar_url')
            .eq('admin_id', adminData.id)
            .neq('is_admin', true),
          
          // Get unassigned users (potential users to claim)
          supabase
            .from('profiles')
            .select('id, first_name, last_name, admin_id, created_at, avatar_url')
            .is('admin_id', null)
            .neq('is_admin', true)
        ]);

        if (assignedUsers.error) {
          console.error('Error fetching assigned users:', assignedUsers.error);
          throw assignedUsers.error;
        }
        
        if (unassignedUsers.error) {
          console.error('Error fetching unassigned users:', unassignedUsers.error);
          throw unassignedUsers.error;
        }

        // Combine both arrays
        const allUsers = [...(assignedUsers.data || []), ...(unassignedUsers.data || [])];
        console.log('Fetched profiles for admin:', allUsers.length, 'profiles');
        console.log('Assigned users:', assignedUsers.data?.length || 0);
        console.log('Unassigned users:', unassignedUsers.data?.length || 0);
        
        // For regular admins, we don't expose email addresses for security
        return allUsers.map(profile => ({
          ...profile,
          email: `${profile.first_name || 'usuário'}@***` // Masked email
        })) as UserProfile[];
      }
      
      console.log('No matching conditions, returning empty array');
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

  const getUnassignedUsers = () => {
    if (!userProfiles) return [];
    return userProfiles.filter(user => !user.admin_id);
  };

  const getMyAssignedUsers = () => {
    if (!userProfiles || !adminData?.id) return [];
    return userProfiles.filter(user => user.admin_id === adminData.id);
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
    getUnassignedUsers,
    getMyAssignedUsers,
    adminData,
    isLoading: isLoadingAdmins || isLoadingUsers,
    isSuperAdmin,
    isAdmin
  };
}