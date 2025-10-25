
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Workout = Database['public']['Tables']['workouts']['Row'] & {
  category?: Database['public']['Tables']['workout_categories']['Row'] | null;
  workout_exercises?: Array<Database['public']['Tables']['workout_exercises']['Row'] & {
    exercise?: Database['public']['Tables']['exercises']['Row'] | null;
    day_of_week?: string | null;
    is_title_section?: boolean;
    section_title?: string | null;
  }>;
  days_of_week?: string[];
};

export function useWorkouts() {
  return useQuery({
    queryKey: ['workouts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          category:category_id (
            id, 
            name,
            icon,
            color
          ),
          workout_exercises (
            id,
            sets,
            reps,
            duration,
            rest,
            order_position,
            exercise:exercise_id (
              id,
              name,
              description,
              image_url,
              video_url
            )
          )
        `)
        .order('created_at', { ascending: false });
      
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
          return workout;
        }

        return {
          ...workout,
          days_of_week: daysData.map(d => d.day_of_week)
        };
      }));
      
      return workoutsWithDays as Workout[];
    },
  });
}

export function useWorkout(id: string | undefined) {
  return useQuery({
    queryKey: ['workout', id],
    queryFn: async () => {
      if (!id) throw new Error('Workout ID is required');
      
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          category:category_id (
            id, 
            name,
            icon,
            color
          ),
          workout_exercises (
            id,
            sets,
            reps,
            duration,
            rest,
            weight,
            order_position,
            day_of_week,
            is_title_section,
            section_title,
            exercise:exercise_id (
              id,
              name,
              description,
              image_url,
              video_url
            )
          )
        `)
        .eq('id', id)
        .single();
      
      
      if (error) {
        throw new Error(`Error fetching workout: ${error.message}`);
      }

      // Fetch days of week for the workout
      const { data: daysData, error: daysError } = await supabase
        .from('workout_days')
        .select('day_of_week')
        .eq('workout_id', id);

      if (daysError) {
        console.error(`Error fetching days for workout ${id}:`, daysError);
      } else {
        // We need to explicitly type data to include the days_of_week property
        (data as Workout).days_of_week = daysData.map(d => d.day_of_week);
      }
      
      return data as Workout & {
        workout_exercises: Array<Database['public']['Tables']['workout_exercises']['Row'] & {
          exercise?: Database['public']['Tables']['exercises']['Row'] | null;
          day_of_week?: string | null;
          is_title_section?: boolean;
          section_title?: string | null;
        }>;
        days_of_week: string[];
      };
    },
    enabled: Boolean(id),
  });
}

export function useWorkoutsByDay(day: string | null) {
  return useQuery({
    queryKey: ['workouts-by-day', day],
    queryFn: async () => {
      if (!day) {
        // Create a new query directly instead of calling useWorkouts().queryFn
        // which doesn't exist in the returned result from useQuery
        const { data: allWorkouts, error } = await supabase
          .from('workouts')
          .select(`
            *,
            category:category_id (
              id, 
              name,
              icon,
              color
            ),
            workout_exercises (
              id,
              sets,
              reps,
              duration,
              rest,
              order_position,
              exercise:exercise_id (
                id,
                name,
                description,
                image_url,
                video_url
              )
            )
          `)
          .order('created_at', { ascending: false });
        
        if (error) {
          throw new Error(`Error fetching workouts: ${error.message}`);
        }
        
        // Fetch days of week for each workout
        const workoutsWithDays = await Promise.all(allWorkouts.map(async (workout) => {
          const { data: daysData, error: daysError } = await supabase
            .from('workout_days')
            .select('day_of_week')
            .eq('workout_id', workout.id);

          if (daysError) {
            console.error(`Error fetching days for workout ${workout.id}:`, daysError);
            return workout;
          }

          return {
            ...workout,
            days_of_week: daysData.map(d => d.day_of_week)
          };
        }));
        
        return workoutsWithDays as Workout[];
      }
      
      // First get workout IDs for the specified day
      const { data: dayWorkouts, error: dayError } = await supabase
        .from('workout_days')
        .select('workout_id')
        .eq('day_of_week', day);
      
      if (dayError) {
        throw new Error(`Error fetching workouts for day ${day}: ${dayError.message}`);
      }
      
      if (dayWorkouts.length === 0) {
        return [] as Workout[];
      }
      
      // Get the full workout data for these IDs
      const workoutIds = dayWorkouts.map(w => w.workout_id);
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          category:category_id (
            id, 
            name,
            icon,
            color
          ),
          workout_exercises (
            id,
            sets,
            reps,
            duration,
            rest,
            order_position,
            exercise:exercise_id (
              id,
              name,
              description,
              image_url,
              video_url
            )
          )
        `)
        .in('id', workoutIds)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(`Error fetching workouts: ${error.message}`);
      }
      
      // Add the days_of_week to each workout
      const workoutsWithDays = await Promise.all(data.map(async (workout) => {
        const { data: daysData, error: daysError } = await supabase
          .from('workout_days')
          .select('day_of_week')
          .eq('workout_id', workout.id);

        if (daysError) {
          console.error(`Error fetching days for workout ${workout.id}:`, daysError);
          return workout;
        }

        return {
          ...workout,
          days_of_week: daysData.map(d => d.day_of_week)
        };
      }));
      
      return workoutsWithDays as Workout[];
    },
    enabled: true,
  });
}

export function useWorkoutCategories() {
  return useQuery({
    queryKey: ['workout-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_categories')
        .select('*')
        .order('name');
      
      if (error) {
        throw new Error(`Error fetching workout categories: ${error.message}`);
      }
      
      return data;
    },
  });
}

// Função modificada para obter apenas treinos específicos para um usuário
export function useRecommendedWorkoutsForUser(userId: string | undefined) {
  return useQuery({
    queryKey: ['recommended-workouts-for-user', userId],
    queryFn: async () => {
      if (!userId) {
        console.log('No user ID provided to useRecommendedWorkoutsForUser, returning empty array');
        return [];
      }
      
      console.log(`Fetching recommended workouts for user: ${userId}`);
      
      // Busque treinos de três formas:
      // 1. Recomendações específicas para este usuário na tabela workout_recommendations
      // 2. Recomendações globais (user_id IS NULL) na tabela workout_recommendations
      // 3. Treinos criados sem user_id específico (treinos globais diretos)
      const { data: userRecommendations, error: recError } = await supabase
        .from('workout_recommendations')
        .select('workout_id')
        .or(`user_id.eq.${userId},user_id.is.null`);
      
      if (recError) {
        console.error("Erro ao buscar recomendações de treinos:", recError);
        return [];
      }
      
      // IDs dos treinos recomendados
      const recommendedWorkoutIds = userRecommendations?.map(item => item.workout_id) || [];
      
      // Buscar também treinos criados sem user_id específico (treinos para todos)
      const { data: globalWorkouts, error: globalError } = await supabase
        .from('workouts')
        .select('id')
        .is('user_id', null);
      
      if (globalError) {
        console.error("Erro ao buscar treinos globais:", globalError);
      }
      
      const globalWorkoutIds = globalWorkouts?.map(w => w.id) || [];
      
      // Combinar IDs de treinos recomendados e globais, removendo duplicatas
      const allWorkoutIds = [...new Set([...recommendedWorkoutIds, ...globalWorkoutIds])];
      
      console.log(`IDs de treinos para usuário ${userId}:`, allWorkoutIds);
      
      if (allWorkoutIds.length === 0) {
        return [];
      }
      
      // Busque os detalhes completos dos treinos
      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select(`
          *,
          category:category_id (
            id, 
            name,
            icon,
            color
          ),
          workout_exercises (
            id,
            sets,
            reps,
            duration,
            rest,
            order_position,
            exercise:exercise_id (
              id,
              name,
              description,
              image_url,
              video_url
            )
          )
        `)
        .in('id', allWorkoutIds)
        .order('created_at', { ascending: false });
      
      if (workoutsError) {
        throw new Error(`Erro ao buscar treinos: ${workoutsError.message}`);
      }
      
      console.log(`Encontrados ${workouts.length} treinos para o usuário ${userId}`);
      
      // Adicione os dias da semana para cada treino
      const workoutsWithDays = await Promise.all(workouts.map(async (workout) => {
        const { data: daysData, error: daysError } = await supabase
          .from('workout_days')
          .select('day_of_week')
          .eq('workout_id', workout.id);

        if (daysError) {
          console.error(`Erro ao buscar dias para o treino ${workout.id}:`, daysError);
          return workout;
        }

        return {
          ...workout,
          days_of_week: daysData.map(d => d.day_of_week)
        };
      }));
      
      return workoutsWithDays as Workout[];
    },
    enabled: !!userId,
  });
}
