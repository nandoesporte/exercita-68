import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { useAdminPermissionsContext } from '@/hooks/useAdminPermissionsContext';

export type AdminWorkout = Database['public']['Tables']['workouts']['Row'] & {
  category?: Database['public']['Tables']['workout_categories']['Row'] | null;
  days_of_week?: string[] | null;
  is_recommended?: boolean;
};

export type WorkoutFormData = {
  title: string;
  description?: string;
  duration: number;
  level: Database['public']['Enums']['workout_level'];
  category_id?: string | null;
  calories?: number | null;
  user_id?: string | null; 
  days_of_week?: string[] | null;
};

export type UpdateWorkoutData = WorkoutFormData & {
  id: string;
};

export type WorkoutExercise = {
  exercise_id?: string;
  sets?: number;
  reps?: number | null;
  duration?: number | null;
  rest?: number | null;
  weight?: number | null;
  order_position: number;
  day_of_week?: string | null;
  is_title_section?: boolean;
  section_title?: string | null;
}

export type WorkoutRecommendation = {
  id?: string;
  workout_id: string;
  user_id: string | null; // null means recommended for all users
}

export function useAdminWorkouts() {
  const queryClient = useQueryClient();
  const { adminId, isSuperAdmin, hasPermission } = useAdminPermissionsContext();
  
  const workoutsQuery = useQuery({
    queryKey: ['admin-workouts', adminId],
    queryFn: async () => {
      if (!hasPermission('manage_workouts')) {
        throw new Error('Você não tem permissão para gerenciar treinos');
      }

      let query = supabase
        .from('workouts')
        .select(`
          *,
          category:category_id (
            id, 
            name,
            icon,
            color
          )
        `)
        .order('created_at', { ascending: false });

      // Filter by admin_id if not super admin
      if (!isSuperAdmin && adminId) {
        query = query.eq('admin_id', adminId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Error fetching workouts: ${error.message}`);
      }

      // Fetch days of week for each workout
      const workoutsWithDays = await Promise.all(data.map(async (workout) => {
        const { data: daysData, error: daysError } = await supabase
          .from('workout_days')
          .select('day_of_week')
          .eq('workout_id', workout.id);

        if (daysError) {
          console.error(`Error fetching days for workout ${workout.id}:`, daysError);
          return { ...workout, days_of_week: [] };
        }

        return {
          ...workout,
          days_of_week: daysData.map(d => d.day_of_week)
        };
      }));
      
      return workoutsWithDays as AdminWorkout[];
    },
    enabled: hasPermission('manage_workouts') && !!adminId,
  });

  const createWorkout = useMutation({
    mutationFn: async (formData: WorkoutFormData) => {
      try {
        console.log("Creating workout with data:", formData);
        
        // First insert the workout
        const { data: workout, error: workoutError } = await supabase
          .from('workouts')
          .insert({
            title: formData.title,
            description: formData.description || null,
            duration: formData.duration,
            level: formData.level,
            category_id: formData.category_id || null,
            calories: formData.calories || null,
          })
          .select('id')
          .single();
        
        if (workoutError) {
          console.error("Error creating workout:", workoutError);
          throw new Error(`Error creating workout: ${workoutError.message}`);
        }

        if (!workout) {
          throw new Error("Failed to create workout: No data returned");
        }

        console.log("Workout created successfully:", workout);

        // If days_of_week are provided, create entries in workout_days
        if (formData.days_of_week && formData.days_of_week.length > 0 && workout) {
          console.log("Adding workout days:", formData.days_of_week);
          const workoutDaysEntries = formData.days_of_week.map(day => ({
            workout_id: workout.id,
            day_of_week: day
          }));

          const { error: daysError } = await supabase
            .from('workout_days')
            .insert(workoutDaysEntries);
          
          if (daysError) {
            console.error("Error assigning days to workout:", daysError);
            toast.error(`Error assigning days to workout: ${daysError.message}`);
          } else {
            console.log("Workout days added successfully");
          }
        }

        // Se um user_id foi fornecido, esse treino deve ser APENAS para esse usuário
        if (formData.user_id && workout) {
          console.log(`Assigning workout exclusively to user: ${formData.user_id}`);
          
          // Adicionar ao histórico de treino do usuário
          const { error: historyError } = await supabase
            .from('user_workout_history')
            .insert({
              user_id: formData.user_id,
              workout_id: workout.id,
              completed_at: null, // Não concluído ainda
            });
          
          if (historyError) {
            console.error("Error assigning workout to user history:", historyError);
            toast.error(`Error assigning workout to user history: ${historyError.message}`);
          } else {
            console.log("Workout added to user history successfully");
          }

          // Adicionar como recomendação específica para este usuário
          const { error: recommendationError } = await supabase
            .from('workout_recommendations')
            .insert({
              user_id: formData.user_id,
              workout_id: workout.id
            });
          
          if (recommendationError) {
            console.error("Error creating workout recommendation:", recommendationError);
            toast.error(`Error creating workout recommendation: ${recommendationError.message}`);
          } else {
            console.log(`Workout recommendation added successfully for user ${formData.user_id}`);
          }
        } else {
          // Se o treino não foi atribuído a um usuário específico, 
          // não fazer nada especial - treino fica como público
          console.log("Workout created as public workout");
        }
      
        return workout;
      } catch (error) {
        console.error("Exception in createWorkout:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workoutHistory'] });
      queryClient.invalidateQueries({ queryKey: ['recommended-workouts-for-user'] });
      toast.success('Workout created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create workout');
    }
  });

  const updateWorkout = useMutation({
    mutationFn: async (data: UpdateWorkoutData) => {
      const { id, days_of_week, ...workoutData } = data;
      
      // First, update the workout
      const { error: workoutError } = await supabase
        .from('workouts')
        .update({
          title: workoutData.title,
          description: workoutData.description || null,
          duration: workoutData.duration,
          level: workoutData.level,
          category_id: workoutData.category_id || null,
          calories: workoutData.calories || null,
        })
        .eq('id', id);
      
      if (workoutError) {
        throw new Error(`Error updating workout: ${workoutError.message}`);
      }

      // If days_of_week are provided, update the workout days
      if (days_of_week !== undefined) {
        // First delete existing workout days
        const { error: deleteError } = await supabase
          .from('workout_days')
          .delete()
          .eq('workout_id', id);
        
        if (deleteError) {
          throw new Error(`Error removing existing workout days: ${deleteError.message}`);
        }

        // If there are days to add, insert them
        if (days_of_week && days_of_week.length > 0) {
          const workoutDaysEntries = days_of_week.map(day => ({
            workout_id: id,
            day_of_week: day
          }));

          const { error: daysError } = await supabase
            .from('workout_days')
            .insert(workoutDaysEntries);
          
          if (daysError) {
            throw new Error(`Error assigning days to workout: ${daysError.message}`);
          }
        }
      }
      
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workout-days'] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      toast.success('Workout updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update workout');
    }
  });

  const deleteWorkout = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(`Error deleting workout: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-workouts'] });
      toast.success('Workout deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete workout');
    }
  });

  const workoutCategoriesQuery = useQuery({
    queryKey: ['admin-workout-categories', adminId],
    queryFn: async () => {
      if (!hasPermission('manage_categories')) {
        throw new Error('Você não tem permissão para gerenciar categorias');
      }

      let query = supabase
        .from('workout_categories')
        .select('*')
        .order('name');

      // Filter by admin_id if not super admin
      if (!isSuperAdmin && adminId) {
        query = query.eq('admin_id', adminId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Error fetching workout categories: ${error.message}`);
      }
      
      return data;
    },
    enabled: hasPermission('manage_categories') && !!adminId,
  });

  // Fetch simplified user data for assigning workouts
  const usersQuery = useQuery({
    queryKey: ['admin-users', adminId],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('first_name');

      // Filter by admin_id if not super admin
      if (!isSuperAdmin && adminId) {
        query = query.eq('admin_id', adminId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Error fetching users: ${error.message}`);
      }
      
      return data;
    },
    enabled: !!adminId,
  });

  // Fetch all exercises for adding to workouts
  const exercisesQuery = useQuery({
    queryKey: ['admin-exercises', adminId],
    queryFn: async () => {
      if (!hasPermission('manage_exercises')) {
        throw new Error('Você não tem permissão para gerenciar exercícios');
      }

      let query = supabase
        .from('exercises')
        .select('*')
        .order('name');

      // Filter by admin_id if not super admin
      if (!isSuperAdmin && adminId) {
        query = query.eq('admin_id', adminId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Error fetching exercises: ${error.message}`);
      }
      
      return data;
    },
    enabled: hasPermission('manage_exercises') && !!adminId,
  });

  // Get workout exercises
  const getWorkoutExercises = (workoutId: string, day_of_week?: string | null) => {
    return useQuery({
      queryKey: ['workout-exercises', workoutId, day_of_week],
      queryFn: async () => {
        let query = supabase
          .from('workout_exercises')
          .select(`
            *,
            exercise:exercise_id (*)
          `)
          .eq('workout_id', workoutId);
        
        // Filter by day if provided
        if (day_of_week) {
          query = query.eq('day_of_week', day_of_week);
        }
        
        const { data, error } = await query.order('order_position');
        
        if (error) {
          throw new Error(`Error fetching workout exercises: ${error.message}`);
        }
        
        return data;
      },
      enabled: Boolean(workoutId),
    });
  };

  // Get workout days
  const getWorkoutDays = (workoutId: string) => {
    return useQuery({
      queryKey: ['workout-days', workoutId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('workout_days')
          .select('day_of_week')
          .eq('workout_id', workoutId);
        
        if (error) {
          throw new Error(`Error fetching workout days: ${error.message}`);
        }
        
        return data.map(d => d.day_of_week);
      },
      enabled: Boolean(workoutId),
    });
  };

  // Fetch workout recommendations
  const getWorkoutRecommendations = (workoutId: string) => {
    return useQuery({
      queryKey: ['workout-recommendations', workoutId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('workout_recommendations')
          .select(`
            *,
            user:user_id (
              id,
              email,
              first_name,
              last_name
            )
          `)
          .eq('workout_id', workoutId);
        
        if (error) {
          throw new Error(`Error fetching workout recommendations: ${error.message}`);
        }
        
        return data;
      },
      enabled: Boolean(workoutId),
    });
  };

  // Add workout recommendation
  const addWorkoutRecommendation = useMutation({
    mutationFn: async (recommendation: WorkoutRecommendation) => {
      const { error } = await supabase
        .from('workout_recommendations')
        .insert({
          workout_id: recommendation.workout_id,
          user_id: recommendation.user_id,
        });
      
      if (error) {
        throw new Error(`Error adding workout recommendation: ${error.message}`);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['workout-recommendations', variables.workout_id] 
      });
      toast.success('Workout recommendation added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add workout recommendation');
    }
  });

  // Remove workout recommendation
  const removeWorkoutRecommendation = useMutation({
    mutationFn: async ({ recommendationId, workoutId }: { recommendationId: string, workoutId: string }) => {
      const { error } = await supabase
        .from('workout_recommendations')
        .delete()
        .eq('id', recommendationId);
      
      if (error) {
        throw new Error(`Error removing workout recommendation: ${error.message}`);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['workout-recommendations', variables.workoutId] 
      });
      toast.success('Workout recommendation removed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove workout recommendation');
    }
  });

  // Add exercise to workout
  const addExerciseToWorkout = useMutation({
    mutationFn: async ({ 
      workoutId, 
      exerciseData 
    }: { 
      workoutId: string, 
      exerciseData: WorkoutExercise 
    }) => {
      const { error } = await supabase
        .from('workout_exercises')
        .insert({
          workout_id: workoutId,
          exercise_id: exerciseData.exercise_id,
          sets: exerciseData.sets,
          reps: exerciseData.reps,
          duration: exerciseData.duration,
          rest: exerciseData.rest,
          weight: exerciseData.weight,
          order_position: exerciseData.order_position,
          day_of_week: exerciseData.day_of_week || null,
          is_title_section: exerciseData.is_title_section || false,
          section_title: exerciseData.section_title || null,
        });
      
      if (error) {
        throw new Error(`Error adding exercise to workout: ${error.message}`);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['workout-exercises', variables.workoutId] 
      });
      toast.success('Exercício adicionado ao treino');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Falha ao adicionar exercício');
    }
  });

  // Remove exercise from workout
  const removeExerciseFromWorkout = useMutation({
    mutationFn: async ({ 
      exerciseId,
      workoutId
    }: { 
      exerciseId: string,
      workoutId: string
    }) => {
      const { error } = await supabase
        .from('workout_exercises')
        .delete()
        .eq('id', exerciseId);
      
      if (error) {
        throw new Error(`Error removing exercise from workout: ${error.message}`);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['workout-exercises', variables.workoutId] 
      });
      toast.success('Exercício removido do treino');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Falha ao remover exercício');
    }
  });

  // Update exercise position
  const updateExerciseOrder = useMutation({
    mutationFn: async ({ 
      exerciseId, 
      newPosition,
      workoutId
    }: { 
      exerciseId: string, 
      newPosition: number,
      workoutId: string
    }) => {
      const { error } = await supabase
        .from('workout_exercises')
        .update({ order_position: newPosition })
        .eq('id', exerciseId);
      
      if (error) {
        throw new Error(`Error updating exercise position: ${error.message}`);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['workout-exercises', variables.workoutId] 
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Falha ao atualizar posição do exercício');
    }
  });

  // Updated cloning function with improved error handling
  const cloneExercisesToDays = useMutation({
    mutationFn: async ({
      workoutId,
      sourceDayOfWeek,
      targetDaysOfWeek
    }: {
      workoutId: string,
      sourceDayOfWeek: string,
      targetDaysOfWeek: string[]
    }) => {
      try {
        console.log(`Cloning exercises from ${sourceDayOfWeek} to days:`, targetDaysOfWeek);
        
        // Get source exercises
        const { data: sourceExercises, error: fetchError } = await supabase
          .from('workout_exercises')
          .select('*')
          .eq('workout_id', workoutId)
          .eq('day_of_week', sourceDayOfWeek)
          .order('order_position');

        if (fetchError) {
          console.error("Error fetching source exercises:", fetchError);
          throw new Error(`Error fetching source exercises: ${fetchError.message}`);
        }

        if (!sourceExercises || sourceExercises.length === 0) {
          console.error("No exercises found to clone");
          throw new Error('No exercises found to clone');
        }

        console.log(`Found ${sourceExercises.length} exercises to clone`);

        // Process each target day
        for (const targetDay of targetDaysOfWeek) {
          try {
            console.log(`Processing target day: ${targetDay}`);
            
            // First delete all existing exercises for the target day to avoid conflicts
            const { error: deleteError } = await supabase
              .from('workout_exercises')
              .delete()
              .eq('workout_id', workoutId)
              .eq('day_of_week', targetDay);
            
            if (deleteError) {
              console.error(`Error removing existing exercises for day ${targetDay}:`, deleteError);
              throw new Error(`Error removing existing exercises: ${deleteError.message}`);
            }
            
            console.log(`Deleted existing exercises for ${targetDay}, now cloning...`);
            
            // Prepare exercises for insertion with the target day
            const exercisesToInsert = sourceExercises.map(exercise => {
              // Extract only the fields we need and exclude id and timestamps
              const { 
                id, created_at, updated_at, ...exerciseData 
              } = exercise;
              
              return {
                ...exerciseData,
                day_of_week: targetDay,
                workout_id: workoutId
              };
            });

            if (exercisesToInsert.length > 0) {
              // Insert exercises for this target day
              const { error: insertError } = await supabase
                .from('workout_exercises')
                .insert(exercisesToInsert);

              if (insertError) {
                console.error(`Error cloning exercises to ${targetDay}:`, insertError);
                throw new Error(`Error cloning exercises to ${targetDay}: ${insertError.message}`);
              }
              
              console.log(`Successfully cloned ${exercisesToInsert.length} exercises to ${targetDay}`);
            }
          } catch (error) {
            console.error(`Error processing day ${targetDay}:`, error);
            throw error;
          }
        }
        
        console.log("Cloning operation completed successfully");
      } catch (error) {
        console.error("Error in cloneExercisesToDays:", error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate queries for all affected days
      queryClient.invalidateQueries({
        queryKey: ['workout-exercises', variables.workoutId]
      });
      toast.success(`Exercícios clonados com sucesso para ${variables.targetDaysOfWeek.length} dia(s)`);
    },
    onError: (error: Error) => {
      console.error("Clone error:", error);
      toast.error(error.message || 'Falha ao clonar exercícios');
    }
  });
  
  return {
    workouts: workoutsQuery.data || [],
    isLoading: workoutsQuery.isLoading,
    error: workoutsQuery.error,
    createWorkout: createWorkout.mutate,
    isCreating: createWorkout.isPending,
    updateWorkout: updateWorkout.mutate,
    isUpdating: updateWorkout.isPending,
    deleteWorkout: deleteWorkout.mutate,
    isDeleting: deleteWorkout.isPending,
    categories: workoutCategoriesQuery.data || [],
    areCategoriesLoading: workoutCategoriesQuery.isLoading,
    users: usersQuery.data || [],
    areUsersLoading: usersQuery.isLoading,
    exercises: exercisesQuery.data || [],
    areExercisesLoading: exercisesQuery.isLoading,
    getWorkoutExercises,
    getWorkoutDays,
    getWorkoutRecommendations,
    addWorkoutRecommendation: addWorkoutRecommendation.mutate,
    isAddingRecommendation: addWorkoutRecommendation.isPending,
    removeWorkoutRecommendation: removeWorkoutRecommendation.mutate,
    isRemovingRecommendation: removeWorkoutRecommendation.isPending,
    addExerciseToWorkout: addExerciseToWorkout.mutate,
    isAddingExercise: addExerciseToWorkout.isPending,
    removeExerciseFromWorkout: removeExerciseFromWorkout.mutate,
    isRemovingExercise: removeExerciseFromWorkout.isPending,
    updateExerciseOrder: updateExerciseOrder.mutate,
    isUpdatingExerciseOrder: updateExerciseOrder.isPending,
    cloneExercisesToDays: cloneExercisesToDays.mutate,
    isCloningExercises: cloneExercisesToDays.isPending
  };
}
