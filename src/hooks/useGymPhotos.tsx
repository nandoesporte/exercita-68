
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useAdminPermissionsContext } from '@/hooks/useAdminPermissionsContext';

export type GymPhoto = {
  id: string;
  photo_url: string;
  description: string | null;
  created_at: string;
  approved: boolean;
  user_id: string;
  profiles?: {
    first_name: string;
    last_name: string;
  } | null;
};

export function useGymPhotos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const { adminId, isSuperAdmin, hasPermission } = useAdminPermissionsContext();

  // Get user's gym photos
  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['gymPhotos', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_gym_photos')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        toast.error('Erro ao carregar fotos');
        console.error('Error fetching gym photos:', error);
        return [];
      }
      
      return data as GymPhoto[];
    },
    enabled: !!user
  });

  // Upload a new gym photo
  const uploadPhoto = useCallback(
    async (file: File, description?: string) => {
      if (!user) {
        toast.error('Você precisa estar logado para enviar fotos');
        return null;
      }
      
      try {
        setUploading(true);
        
        // Create a unique file name to avoid conflicts
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${uuidv4()}.${fileExt}`;
        
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('gym_photos')
          .upload(fileName, file);
          
        if (uploadError) {
          throw uploadError;
        }
        
        // Get the public URL
        const { data: publicURL } = supabase.storage
          .from('gym_photos')
          .getPublicUrl(fileName);
          
        // Insert record in database with user_id (admin_id will be set by trigger)
        const insertData = {
          user_id: user.id,
          photo_url: publicURL.publicUrl,
          description: description || null
        };
        
        const { data: photoRecord, error: insertError } = await supabase
          .from('user_gym_photos')
          .insert(insertData)
          .select('*')
          .single();
          
        if (insertError) {
          console.error('Database insert error:', insertError);
          throw insertError;
        }
        
        // Invalidate query to refetch photos
        queryClient.invalidateQueries({ queryKey: ['gymPhotos', user.id] });
        
        toast.success('Foto enviada com sucesso');
        return photoRecord as GymPhoto;
      } catch (error: any) {
        console.error('Error uploading photo:', error);
        toast.error(`Erro ao enviar foto: ${error.message}`);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [user, queryClient]
  );

  // Delete a gym photo
  const { mutate: deletePhoto } = useMutation({
    mutationFn: async (photoId: string) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data: photo } = await supabase
        .from('user_gym_photos')
        .select('photo_url')
        .eq('id', photoId)
        .single();
        
      if (!photo) throw new Error('Foto não encontrada');
      
      // Extract the path from the URL
      const urlParts = photo.photo_url.split('/');
      const filePathParts = urlParts.slice(urlParts.indexOf('gym_photos'));
      const filePath = filePathParts.join('/');
      
      // Delete from storage
      await supabase.storage
        .from('gym_photos')
        .remove([filePath]);
        
      // Delete from database
      const { error } = await supabase
        .from('user_gym_photos')
        .delete()
        .eq('id', photoId);
        
      if (error) throw error;
      
      return photoId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gymPhotos', user?.id] });
      toast.success('Foto removida com sucesso');
    },
    onError: (error) => {
      console.error('Error deleting photo:', error);
      toast.error('Erro ao remover foto');
    }
  });

  // Admin functions for viewing all photos
  const { data: allPhotos = [], isLoading: isLoadingAll } = useQuery({
    queryKey: ['adminGymPhotos', adminId],
    queryFn: async () => {
      if (!user || !hasPermission('manage_gym_photos')) return [];
      
      // First fetch photos with admin filter
      let photoQuery = supabase
        .from('user_gym_photos')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by admin_id if not super admin
      if (!isSuperAdmin && adminId) {
        photoQuery = photoQuery.eq('admin_id', adminId);
      }
      
      const { data: photoData, error: photoError } = await photoQuery;
        
      if (photoError) {
        toast.error('Erro ao carregar fotos');
        console.error('Error fetching all gym photos:', photoError);
        return [];
      }
      
      // Then fetch all user profiles
      const userIds = photoData.map(photo => photo.user_id);
      if (userIds.length === 0) return [];
      
      let profilesQuery = supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      // Also filter profiles by admin_id if not super admin
      if (!isSuperAdmin && adminId) {
        profilesQuery = profilesQuery.eq('admin_id', adminId);
      }
      
      const { data: profilesData, error: profilesError } = await profilesQuery;
        
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }
      
      // Create a map of user profiles by ID
      const profilesMap = (profilesData || []).reduce((map, profile) => {
        map[profile.id] = profile;
        return map;
      }, {});
      
      // Combine the data
      const photosWithProfiles = photoData.map(photo => ({
        ...photo,
        profiles: profilesMap[photo.user_id] || null
      }));
      
      return photosWithProfiles;
    },
    enabled: !!user && hasPermission('manage_gym_photos') && !!adminId
  });

  // Admin function to approve/reject a photo
  const { mutate: updateApprovalStatus } = useMutation({
    mutationFn: async ({ photoId, approved }: { photoId: string; approved: boolean }) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const { error } = await supabase
        .from('user_gym_photos')
        .update({ approved })
        .eq('id', photoId);
        
      if (error) throw error;
      
      return { photoId, approved };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminGymPhotos'] });
      toast.success('Status da foto atualizado');
    },
    onError: (error) => {
      console.error('Error updating photo status:', error);
      toast.error('Erro ao atualizar status da foto');
    }
  });

  return {
    photos,
    isLoading,
    uploading,
    uploadPhoto,
    deletePhoto,
    // Admin functions
    allPhotos,
    isLoadingAll,
    updateApprovalStatus
  };
}
