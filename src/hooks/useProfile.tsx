import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { updateUserProfile, fetchUserProfile } from '@/contexts/auth/profileUtils';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

interface PixKey {
  id: string;
  key_type: 'cpf' | 'email' | 'phone' | 'random';
  key_value: string;
  recipient_name: string;
  is_primary: boolean;
}

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const profileQuery = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) {
        console.log('Profile fetch skipped: No authenticated user');
        return null;
      }
      
      try {
        console.log('Fetching profile for user:', user.id);
        
        // First check localStorage for cached user data
        const cachedUserStr = localStorage.getItem('user_cache');
        if (cachedUserStr) {
          try {
            const cachedUser = JSON.parse(cachedUserStr);
            // Check if cache is for the current user and not too old (24 hours)
            if (cachedUser.id === user.id && (Date.now() - cachedUser.cached_at) < 24 * 60 * 60 * 1000) {
              console.log('Using localStorage cached profile data for instant display');
              // Set initial data immediately while we fetch fresh data in background
              queryClient.setQueryData(['profile', user.id], cachedUser);
            }
          } catch (parseError) {
            console.error('Error parsing cached user data:', parseError);
            localStorage.removeItem('user_cache');
          }
        }
        
        // Then check React Query cache
        const cachedData = queryClient.getQueryData<Profile>(['profile', user.id]);
        
        // Fetch fresh data from database
        const profile = await fetchUserProfile(user.id);
        
        if (!profile) {
          console.error('Failed to fetch profile data');
          return cachedData || null;
        }
        
        // Update localStorage cache with fresh data
        try {
          const newCachedUserData = {
            id: user.id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            avatar_url: profile.avatar_url,
            cached_at: Date.now()
          };
          localStorage.setItem('user_cache', JSON.stringify(newCachedUserData));
        } catch (cacheError) {
          console.error('Error updating localStorage cache:', cacheError);
        }
        
        console.log('Fresh profile data loaded:', profile);
        return profile as Profile;
      } catch (error) {
        console.error('Exception in profile fetch:', error);
        
        // Fallback to cached data if available
        const cachedData = queryClient.getQueryData<Profile>(['profile', user.id]);
        return cachedData || null;
      }
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
    gcTime: 1000 * 60 * 30, // Keep cache for 30 minutes
  });

  const pixKeyQuery = useQuery({
    queryKey: ['pixKey', 'primary', user?.id, profileQuery.data?.admin_id, profileQuery.data?.is_admin],
    queryFn: async () => {
      if (!user) {
        console.log('PIX key fetch skipped: No authenticated user');
        return null;
      }
      
      const currentProfile = profileQuery.data;
      console.log('🔍 PIX Key Debug - Current profile:', currentProfile);
      console.log('🔍 PIX Key Debug - User ID:', user?.id);
      console.log('🔍 PIX Key Debug - Admin ID:', currentProfile?.admin_id);
      console.log('🔍 PIX Key Debug - Is Admin:', currentProfile?.is_admin);
      
      try {
        // First try to get PIX key from user's admin
        if (currentProfile?.admin_id) {
          console.log('🔍 PIX Key Debug - Searching for admin PIX key with admin_id:', currentProfile.admin_id);
          
          const { data: adminPixKey, error: adminError } = await supabase
            .from('pix_keys')
            .select('*')
            .eq('admin_id', currentProfile.admin_id)
            .limit(1)
            .single();
            
          console.log('🔍 PIX Key Debug - Admin PIX key result:', { adminPixKey, adminError });
            
          if (!adminError && adminPixKey) {
            console.log('✅ PIX Key Debug - Found admin PIX key:', adminPixKey);
            return {
              id: adminPixKey.id,
              key_type: adminPixKey.key_type as 'cpf' | 'email' | 'phone' | 'random',
              key_value: adminPixKey.key_value,
              recipient_name: adminPixKey.recipient_name,
              is_primary: adminPixKey.is_primary || false,
            } as PixKey;
          } else {
            console.log('❌ PIX Key Debug - No admin PIX key found or error:', adminError);
          }
        }
        
        // If user is admin, get their own PIX keys
        if (currentProfile?.is_admin) {
          console.log('🔍 PIX Key Debug - User is admin, getting own PIX keys');
          
          const { data: adminData } = await supabase
            .from('admins')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
            
          console.log('🔍 PIX Key Debug - Admin data:', adminData);
            
          if (adminData) {
            const { data: ownPixKey, error: ownError } = await supabase
              .from('pix_keys')
              .select('*')
              .eq('admin_id', adminData.id)
              .eq('is_primary', true)
              .maybeSingle();
              
            console.log('🔍 PIX Key Debug - Own PIX key result:', { ownPixKey, ownError });
              
            if (!ownError && ownPixKey) {
              console.log('✅ PIX Key Debug - Found own PIX key:', ownPixKey);
              return {
                id: ownPixKey.id,
                key_type: ownPixKey.key_type as 'cpf' | 'email' | 'phone' | 'random',
                key_value: ownPixKey.key_value,
                recipient_name: ownPixKey.recipient_name,
                is_primary: ownPixKey.is_primary || false,
              } as PixKey;
            }
          }
        }
        
        console.log('❌ PIX Key Debug - No PIX key found for this user');
        return null;
      } catch (error) {
        console.error('Exception in PIX key fetch:', error);
        return null;
      }
    },
    enabled: !!user && !!profileQuery.data,
    staleTime: 1000 * 60, // Consider data stale after 1 minute
  });
  
  const updateProfile = useMutation({
    mutationFn: async (profileData: ProfileUpdate): Promise<Profile | null> => {
      if (!user) {
        console.error('Profile update aborted: No authenticated user');
        throw new Error('Usuário precisa estar logado');
      }
      
      console.log('Atualizando perfil com dados:', profileData);
      
      // Ensure all fields are properly formatted
      const cleanedProfileData = Object.entries(profileData).reduce((acc, [key, value]) => {
        // Skip null or undefined values to prevent overwriting with nulls
        if (value !== undefined && value !== null) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);
      
      console.log('Dados limpos para atualização:', cleanedProfileData);
      
      // Cache the current data before update for rollback if needed
      const currentData = queryClient.getQueryData<Profile>(['profile', user.id]);
      
      // Optimistically update the UI
      if (currentData) {
        queryClient.setQueryData(['profile', user.id], {
          ...currentData,
          ...cleanedProfileData,
        });
      }
      
      // Use the utility function for profile updates
      const success = await updateUserProfile(user.id, cleanedProfileData);
      
      if (!success) {
        // Roll back to previous data if update failed
        if (currentData) {
          queryClient.setQueryData(['profile', user.id], currentData);
        }
        throw new Error('Erro ao atualizar perfil');
      }
      
      // Get the updated profile data
      const updatedProfile = await fetchUserProfile(user.id);
      
      if (!updatedProfile) {
        throw new Error('Erro ao obter perfil atualizado');
      }
      
      console.log('Perfil atualizado com sucesso:', updatedProfile);
      return updatedProfile as Profile;
    },
    onSuccess: (updatedProfile) => {
      if (updatedProfile) {
        // Update cache immediately with new data
        queryClient.setQueryData(['profile', user?.id], updatedProfile);
        // This won't trigger a refetch since we already have the data
        queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
        toast('Perfil atualizado com sucesso');
      }
    },
    onError: (error: Error) => {
      console.error('Erro na atualização do perfil:', error);
      toast(error.message || 'Falha ao atualizar o perfil');
    }
  });
  
  const uploadProfileImage = useMutation({
    mutationFn: async (file: File) => {
      if (!user) {
        console.error('Image upload aborted: No authenticated user');
        throw new Error('Usuário precisa estar logado');
      }
      
      // Create a unique filename that won't overwrite previous uploads
      const fileExt = file.name.split('.').pop();
      const uniqueId = uuidv4(); // Generate a unique ID for this upload
      const filePath = `${user.id}/${uniqueId}.${fileExt}`;
      
      console.log('Fazendo upload da imagem do perfil:', filePath);
      
      // Upload file to storage with caching disabled
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: 'no-cache, no-store, must-revalidate',
          upsert: true,
        });
      
      if (uploadError) {
        console.error('Erro ao fazer upload da imagem:', uploadError);
        throw new Error(`Erro ao fazer upload da imagem: ${uploadError.message}`);
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      if (!urlData || !urlData.publicUrl) {
        throw new Error('Erro ao obter URL pública do avatar');
      }
      
      // Get a clean URL without cache parameters
      let avatarUrl = urlData.publicUrl;
      
      console.log('Avatar URL antes de salvamento permanente:', avatarUrl);
      
      // Store the plain URL without any params to ensure consistency
      try {
        const url = new URL(avatarUrl);
        url.search = '';
        avatarUrl = url.toString();
      } catch (e) {
        console.error('Error parsing URL:', e);
        // Continue with original URL if parsing fails
      }
      
      // Cache current profile data before update
      const currentProfile = queryClient.getQueryData<Profile>(['profile', user.id]);
      
      // Update profile with new avatar URL using updateUserProfile utility
      const success = await updateUserProfile(user.id, { avatar_url: avatarUrl });
      
      if (!success) {
        throw new Error('Erro ao atualizar perfil com novo avatar');
      }
      
      // Get the updated profile
      const updatedProfile = await fetchUserProfile(user.id);
      
      if (!updatedProfile) {
        throw new Error('Erro ao obter perfil atualizado');
      }
      
      console.log('Perfil atualizado com novo avatar:', updatedProfile);
      
      return { 
        avatarUrl, 
        updatedProfile 
      };
    },
    onSuccess: (result) => {
      // Update profile cache with new data
      if (result.updatedProfile && user?.id) {
        queryClient.setQueryData(['profile', user.id], result.updatedProfile);
        console.log('Profile cache updated with new avatar');
      }
      
      toast('Foto de perfil atualizada com sucesso');
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar foto de perfil:', error);
      toast(error.message || 'Falha ao atualizar foto de perfil');
    }
  });

  // Immediate refresh method that forces a full data reload
  const refreshProfile = useCallback(() => {
    if (!user?.id) return;
    
    console.log('Forcing complete profile refresh');
    
    // Force immediate refetch from server
    queryClient.invalidateQueries({ 
      queryKey: ['profile', user.id],
      refetchType: 'active',
    });
    
    queryClient.invalidateQueries({ 
      queryKey: ['pixKey', 'primary', user.id],
      refetchType: 'active',
    });
    
    // Force immediate refetch
    queryClient.refetchQueries({ queryKey: ['profile', user.id] });
  }, [user?.id, queryClient]);
  
  // Function to ensure avatar URL has necessary cache busting for display
  const getDisplayAvatarUrl = (url?: string | null): string | null => {
    if (!url) return null;
    
    try {
      const parsedUrl = new URL(url);
      // Only add cache busting if not already present
      if (!parsedUrl.searchParams.has('t')) {
        parsedUrl.searchParams.set('t', Date.now().toString());
        return parsedUrl.toString();
      }
      return url;
    } catch (e) {
      console.error('Error parsing avatar URL:', e);
      return url;
    }
  };
  
  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading || !user,
    error: profileQuery.error,
    updateProfile: updateProfile.mutate,
    isUpdating: updateProfile.isPending,
    uploadProfileImage: uploadProfileImage.mutate,
    isUploadingImage: uploadProfileImage.isPending,
    pixKey: pixKeyQuery.data,
    isLoadingPixKey: pixKeyQuery.isLoading || !user,
    refreshProfile,
    getDisplayAvatarUrl,
  };
}
