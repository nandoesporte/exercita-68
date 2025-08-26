import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminPermissionsContext } from './useAdminPermissionsContext';
import { toast } from '@/lib/toast-wrapper';

interface PersonalTrainer {
  id: string;
  name: string;
  credentials: string;
  bio: string;
  whatsapp: string;
  photo_url: string | null;
  is_primary: boolean;
  admin_id: string | null;
}

interface TrainerFormData {
  name: string;
  credentials: string;
  bio: string;
  whatsapp: string;
  photo_url?: string | null;
}

export function usePersonalTrainer() {
  const queryClient = useQueryClient();
  const { isSuperAdmin, isAdmin, adminId } = useAdminPermissionsContext();

  // Fetch trainer data
  const {
    data: trainer,
    isLoading,
    error
  } = useQuery({
    queryKey: ['personal-trainer', adminId],
    queryFn: async () => {
      let query = supabase
        .from('personal_trainers')
        .select('*')
        .eq('is_primary', true);
      
      // If user is not super admin, filter by their admin_id or null (global)
      if (!isSuperAdmin && adminId) {
        query = query.or(`admin_id.eq.${adminId},admin_id.is.null`);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      return data as PersonalTrainer | null;
    },
    enabled: true, // Always enable query - all users should see trainer info
  });

  // Create or update trainer
  const updateTrainerMutation = useMutation({
    mutationFn: async (formData: TrainerFormData) => {
      const trainerData = {
        name: formData.name,
        credentials: formData.credentials,
        bio: formData.bio,
        whatsapp: formData.whatsapp,
        photo_url: formData.photo_url,
        is_primary: true,
      };

      if (trainer?.id) {
        // Update existing trainer
        const { data, error } = await supabase
          .from('personal_trainers')
          .update(trainerData)
          .eq('id', trainer.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new trainer
        const { data, error } = await supabase
          .from('personal_trainers')
          .insert(trainerData)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-trainer'] });
      toast("Salvo com sucesso: As informações do personal trainer foram atualizadas.");
    },
    onError: (error) => {
      console.error('Error saving trainer:', error);
      toast("Erro ao salvar: Não foi possível salvar as informações. Tente novamente.");
    },
  });

  // Upload photo
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `trainer-profile-${Date.now()}.${fileExt}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('trainer_photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('trainer_photos')
        .getPublicUrl(fileName);

      return data.publicUrl;
    },
    onSuccess: () => {
      toast("Foto enviada com sucesso: A foto do perfil foi atualizada.");
    },
    onError: (error) => {
      console.error('Error uploading photo:', error);
      toast("Erro no upload: Não foi possível enviar a foto. Tente novamente.");
    },
  });

  return {
    trainer,
    isLoading,
    error,
    updateTrainer: updateTrainerMutation.mutate,
    isUpdating: updateTrainerMutation.isPending,
    uploadPhoto: uploadPhotoMutation.mutate,
    isUploading: uploadPhotoMutation.isPending,
    photoUrl: uploadPhotoMutation.data,
  };
}