import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast-wrapper';
import { useAdminPermissionsContext } from '@/hooks/useAdminPermissionsContext';

export interface ExerciseCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  created_at?: string;
  updated_at?: string;
}

export const useExerciseCategories = () => {
  const queryClient = useQueryClient();
  const { adminId, isSuperAdmin, isLoading: permissionsLoading } = useAdminPermissionsContext();

  // Fetch exercise categories
  const { 
    data: categories = [], 
    isLoading: isLoadingCategories 
  } = useQuery({
    queryKey: ['admin-workout-categories', adminId],
    queryFn: async () => {
      console.log('Fetching categories with adminId:', adminId, 'isSuperAdmin:', isSuperAdmin);
      
      let query = supabase
        .from('workout_categories')
        .select('*');

      // Filter by admin_id for non-super admins
      if (!isSuperAdmin && adminId && adminId !== 'super_admin') {
        query = query.eq('admin_id', adminId);
      }

      const { data, error } = await query.order('name');

      if (error) {
        console.error('Error fetching exercise categories:', error);
        toast.error('Erro ao carregar categorias');
        return [];
      }

      console.log('Categories fetched:', data);
      return data as ExerciseCategory[];
    },
    enabled: !permissionsLoading && (!!adminId || isSuperAdmin),
  });

  // Create a category
  const { mutateAsync: createCategory, isPending: isCreatingCategory } = useMutation({
    mutationFn: async (categoryData: Omit<ExerciseCategory, 'id'>) => {
      // Add admin_id to the category data
      const categoryWithAdmin = {
        ...categoryData,
        admin_id: adminId
      };

      const { data, error } = await supabase
        .from('workout_categories')
        .insert([categoryWithAdmin])
        .select()
        .single();

      if (error) {
        console.error('Error creating category:', error);
        toast.error('Erro ao criar categoria');
        throw error;
      }

      toast.success('Categoria criada com sucesso');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-workout-categories', adminId] });
    }
  });

  // Update a category
  const { mutateAsync: updateCategory, isPending: isUpdatingCategory } = useMutation({
    mutationFn: async (category: ExerciseCategory) => {
      const { data, error } = await supabase
        .from('workout_categories')
        .update({
          name: category.name,
          color: category.color,
          icon: category.icon
        })
        .eq('id', category.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating category:', error);
        toast.error('Erro ao atualizar categoria');
        throw error;
      }

      toast.success('Categoria atualizada com sucesso');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-workout-categories', adminId] });
    }
  });

  // Delete a category
  const { mutateAsync: deleteCategory, isPending: isDeletingCategory } = useMutation({
    mutationFn: async (id: string) => {
      try {
        // First update any exercises using this category to set category_id to null
        const { error: exercisesError } = await supabase
          .from('exercises')
          .update({ category_id: null })
          .eq('category_id', id);
          
        if (exercisesError) {
          console.error('Error updating exercises:', exercisesError);
          throw exercisesError;
        }
        
        // Then delete the category
        const { error } = await supabase
          .from('workout_categories')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting category:', error);
          throw error;
        }

        toast.success('Categoria excluída com sucesso');
        return id;
      } catch (error) {
        console.error('Error in delete operation:', error);
        toast.error('Erro ao excluir categoria');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-workout-categories', adminId] });
    }
  });

  // Auto-create default categories
  const { mutateAsync: createDefaultCategories } = useMutation({
    mutationFn: async () => {
      const defaultCategories = [
        { name: 'Bíceps', color: '#FF6B6B', icon: 'dumbbell', admin_id: adminId },
        { name: 'Tríceps', color: '#4ECDC4', icon: 'dumbbell', admin_id: adminId },
        { name: 'Peito', color: '#45B7D1', icon: 'dumbbell', admin_id: adminId },
        { name: 'Ombros', color: '#96CEB4', icon: 'dumbbell', admin_id: adminId },
        { name: 'Costas', color: '#FECA57', icon: 'dumbbell', admin_id: adminId },
        { name: 'Pernas', color: '#FF9FF3', icon: 'dumbbell', admin_id: adminId },
        { name: 'Panturrilhas', color: '#54A0FF', icon: 'dumbbell', admin_id: adminId },
        { name: 'Glúteos', color: '#5F27CD', icon: 'dumbbell', admin_id: adminId },
        { name: 'Trapézio', color: '#00D2D3', icon: 'dumbbell', admin_id: adminId },
        { name: 'Antebraços', color: '#FF9F43', icon: 'dumbbell', admin_id: adminId },
        { name: 'Eratores da Espinha', color: '#10AC84', icon: 'dumbbell', admin_id: adminId },
        { name: 'Cardio Academia', color: '#EE5A24', icon: 'heart', admin_id: adminId }
      ];

      const results = [];
      for (const category of defaultCategories) {
        try {
          const { data, error } = await supabase
            .from('workout_categories')
            .insert([category])
            .select()
            .single();

          if (error && !error.message.includes('duplicate')) {
            console.error('Error creating default category:', error);
          } else if (data) {
            results.push(data);
          }
        } catch (error) {
          console.log('Category might already exist:', category.name);
        }
      }

      toast.success(`${results.length} categorias padrão criadas com sucesso`);
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-workout-categories', adminId] });
    }
  });

  // Force refresh data
  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-workout-categories'] });
    queryClient.invalidateQueries({ queryKey: ['users-by-admin'] });
  };

  // Auto refresh when adminId changes
  React.useEffect(() => {
    if (adminId) {
      refreshData();
    }
  }, [adminId]);

  return {
    categories,
    isLoadingCategories,
    createCategory,
    isCreatingCategory,
    updateCategory,
    isUpdatingCategory,
    deleteCategory,
    isDeletingCategory,
    createDefaultCategories,
    refreshData,
  };
};