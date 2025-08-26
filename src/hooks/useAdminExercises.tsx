
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { toast } from '@/lib/toast-wrapper';
import { v4 as uuidv4 } from 'uuid';
import { useAdminPermissionsContext } from '@/hooks/useAdminPermissionsContext';

export type AdminExercise = Database['public']['Tables']['exercises']['Row'] & {
  category?: Database['public']['Tables']['workout_categories']['Row'] | null;
};

export type ExerciseFormData = {
  name: string;
  description?: string | null;
  category_id?: string | null;
  image_url?: string | null;
  video_url?: string | null;
};

export type BatchExerciseFormData = {
  name: string;
  description?: string | null;
  category_id: string;
  image_url?: string | null;
  video_url?: string | null;
};

export function useAdminExercises() {
  const queryClient = useQueryClient();
  const { adminId, isSuperAdmin, hasPermission } = useAdminPermissionsContext();
  
  // Helper function to validate UUID format
  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };
  
  const exercisesQuery = useQuery({
    queryKey: ['admin-exercises', adminId, isSuperAdmin],
    queryFn: async () => {
      if (!hasPermission('manage_exercises')) {
        console.log('User does not have manage_exercises permission');
        throw new Error('Você não tem permissão para gerenciar exercícios');
      }

      try {
        console.log('Fetching exercises with adminId:', adminId, 'isSuperAdmin:', isSuperAdmin);
        
        let query = supabase
          .from('exercises')
          .select(`
            *,
            category:category_id (
              id, 
              name,
              icon,
              color
            )
          `)
          .order('name');

        // Filter by admin_id if not super admin
        if (!isSuperAdmin && adminId && adminId !== 'super_admin') {
          // Include both admin-specific exercises and global exercises (admin_id IS NULL)
          console.log('Adding admin filter for adminId:', adminId);
          query = query.or(`admin_id.eq.${adminId},admin_id.is.null`);
        } else if (isSuperAdmin) {
          // Super admin sees all exercises
          console.log('Super admin - showing all exercises');
        } else {
          // No admin ID, show only global exercises
          console.log('No admin ID - showing only global exercises');
          query = query.is('admin_id', null);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Supabase error:', error);
          throw new Error(`Erro ao buscar exercícios: ${error.message}`);
        }
        
        console.log('Exercises fetched:', data?.length, 'exercises');
        console.log('First 3 exercises:', data?.slice(0, 3));
        
        return data as AdminExercise[];
      } catch (error: any) {
        console.error('Error in exercisesQuery:', error);
        throw error;
      }
    },
    enabled: hasPermission('manage_exercises'),
  });

  const createExercise = useMutation({
    mutationFn: async (formData: ExerciseFormData) => {
      try {
        const { data, error } = await supabase
          .from('exercises')
          .insert({
            name: formData.name,
            description: formData.description || null,
            category_id: formData.category_id || null,
            image_url: formData.image_url || null,
            video_url: formData.video_url || null,
          })
          .select()
          .single();
        
        if (error) {
          throw new Error(`Erro ao criar exercício: ${error.message}`);
        }
        
        return data;
      } catch (error: any) {
        console.error('Error in createExercise:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-exercises'] });
      toast.success('Exercício criado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Falha ao criar exercício');
    }
  });

  const batchCreateExercises = useMutation({
    mutationFn: async (exercises: BatchExerciseFormData[]) => {
      try {
        console.log("Batch creating exercises with data:", exercises);
        
        // Validate that all category_ids are valid UUIDs and exist in the database
        for (const exercise of exercises) {
          if (!exercise.category_id) {
            throw new Error(`Categoria não especificada para exercício: ${exercise.name}`);
          }
          
          if (!isValidUUID(exercise.category_id)) {
            throw new Error(`Formato de ID de categoria inválido: ${exercise.category_id}`);
          }
          
          // Check if category exists in database
          const { data, error } = await supabase
            .from('workout_categories')
            .select('id')
            .eq('id', exercise.category_id)
            .single();
            
          if (error || !data) {
            throw new Error(`Categoria não encontrada no banco de dados para o ID: ${exercise.category_id}`);
          }
        }
        
        const { data, error } = await supabase
          .from('exercises')
          .insert(exercises)
          .select();
        
        if (error) {
          throw new Error(`Erro ao criar exercícios em lote: ${error.message}`);
        }
        
        return data;
      } catch (error: any) {
        console.error('Error in batchCreateExercises:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-exercises'] });
      toast.success('Exercícios criados com sucesso em lote');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Falha ao criar exercícios em lote');
    }
  });

  const updateExercise = useMutation({
    mutationFn: async ({ 
      id, 
      ...formData 
    }: ExerciseFormData & { id: string }) => {
      try {
        const { data, error } = await supabase
          .from('exercises')
          .update({
            name: formData.name,
            description: formData.description || null,
            category_id: formData.category_id || null,
            image_url: formData.image_url || null,
            video_url: formData.video_url || null,
          })
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          throw new Error(`Erro ao atualizar exercício: ${error.message}`);
        }
        
        return data;
      } catch (error: any) {
        console.error('Error in updateExercise:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-exercises'] });
      toast.success('Exercício atualizado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Falha ao atualizar exercício');
    }
  });

  const deleteExercise = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase
          .from('exercises')
          .delete()
          .eq('id', id);
        
        if (error) {
          throw new Error(`Erro ao excluir exercício: ${error.message}`);
        }
      } catch (error: any) {
        console.error('Error in deleteExercise:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-exercises'] });
      toast.success('Exercício excluído com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Falha ao excluir exercício');
    }
  });

  const workoutCategoriesQuery = useQuery({
    queryKey: ['admin-workout-categories', adminId, isSuperAdmin],
    queryFn: async () => {
      if (!hasPermission('manage_categories') && !hasPermission('manage_exercises')) {
        throw new Error('Você não tem permissão para gerenciar categorias');
      }

      try {
        let query = supabase
          .from('workout_categories')
          .select('*')
          .order('name');

        // Filter by admin_id if not super admin
        if (!isSuperAdmin && adminId && adminId !== 'super_admin') {
          // Include both admin-specific categories and global categories (admin_id IS NULL)
          query = query.or(`admin_id.eq.${adminId},admin_id.is.null`);
        } else if (isSuperAdmin) {
          // Super admin sees all categories
        } else {
          // No admin ID, show only global categories
          query = query.is('admin_id', null);
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw new Error(`Erro ao buscar categorias: ${error.message}`);
        }
        
        return data;
      } catch (error: any) {
        console.error('Error in workoutCategoriesQuery:', error);
        throw error;
      }
    },
    enabled: hasPermission('manage_categories') || hasPermission('manage_exercises'),
  });

  // Create or check storage bucket
  const checkStorageBucket = async () => {
    try {
      const { data, error } = await supabase.storage.getBucket('exercises');
      if (error && error.message.includes('not found')) {
        // Create bucket if it doesn't exist
        const { error: createError } = await supabase.storage.createBucket('exercises', {
          public: true
        });
        if (createError) {
          console.error("Error creating storage bucket:", createError);
          return false;
        }
        return true;
      }
      return !!data;
    } catch (error) {
      console.error("Error checking storage bucket:", error);
      return false;
    }
  };

  return {
    exercises: exercisesQuery.data || [],
    isLoading: exercisesQuery.isLoading,
    error: exercisesQuery.error,
    createExercise: createExercise.mutate,
    isCreating: createExercise.isPending,
    batchCreateExercises: batchCreateExercises.mutate,
    isBatchCreating: batchCreateExercises.isPending,
    updateExercise: updateExercise.mutate,
    isUpdating: updateExercise.isPending,
    deleteExercise: deleteExercise.mutate,
    isDeleting: deleteExercise.isPending,
    categories: workoutCategoriesQuery.data || [],
    areCategoriesLoading: workoutCategoriesQuery.isLoading,
    checkStorageBucket,
    isValidUUID
  };
}
