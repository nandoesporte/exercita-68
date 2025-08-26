
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type WorkoutHistoryItem = {
  id: string;
  user_id: string;
  workout_id: string;
  workout: {
    id: string;
    title: string;
    level: string;
    duration: number;
    calories: number;
    image_url: string | null;
    category_id: string | null;
    category?: {
      id: string;
      name: string;
      color: string;
    } | null;
  };
  completed_at: string;
  duration: number | null;
  calories_burned: number | null;
  rating: number | null;
  notes: string | null;
};

export const fetchWorkoutHistory = async (): Promise<WorkoutHistoryItem[]> => {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error("Usuário não autenticado");
  }
  
  try {
    const { data, error } = await supabase
      .from("user_workout_history")
      .select(`
        id,
        user_id,
        workout_id,
        workout:workouts (
          id,
          title,
          level,
          duration,
          calories,
          image_url,
          category_id,
          category:workout_categories (
            id,
            name,
            color
          )
        ),
        completed_at,
        duration,
        calories_burned,
        rating,
        notes
      `)
      .eq("user_id", user.user.id)
      .order("completed_at", { ascending: false });
    
    if (error) {
      console.error("Erro ao buscar histórico de treinos:", error);
      throw new Error("Falha ao carregar histórico de treinos");
    }
    
    // Transform the data to match the expected format
    // Supabase returns workout and category as arrays due to the nested select
    // We need to convert them to single objects to match our type definition
    const formattedData = data?.map(item => {
      // Make sure the workout data exists
      if (!item.workout || (Array.isArray(item.workout) && item.workout.length === 0)) {
        console.warn("Workout data missing for history item:", item);
      }
      
      // Extract the workout from the array
      const workoutData = Array.isArray(item.workout) && item.workout.length > 0 
        ? item.workout[0] 
        : { 
            id: item.workout_id, 
            title: 'Treino Personalizado', 
            level: 'beginner', 
            duration: 0, 
            calories: 0, 
            image_url: null, 
            category_id: null,
            // Add the category property to avoid TypeScript errors
            category: null
          };
      
      // Extract the category if it exists and if the workout has a category property
      let categoryData = null;
      if ('category' in workoutData && Array.isArray(workoutData.category) && workoutData.category.length > 0) {
        categoryData = workoutData.category[0];
      } else if ('category' in workoutData && workoutData.category && !Array.isArray(workoutData.category)) {
        categoryData = workoutData.category;
      }
      
      // Return a properly formatted item
      return {
        ...item,
        workout: {
          ...workoutData,
          category: categoryData
        }
      };
    }) || [];
    
    return formattedData as WorkoutHistoryItem[];
  } catch (err) {
    console.error("Exception in workout history fetch:", err);
    throw new Error("Falha ao processar histórico de treinos");
  }
};

// Function to fetch the user's personalized workout
export const fetchUserPersonalizedWorkout = async (): Promise<string | null> => {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error("Usuário não autenticado");
  }
  
  try {
    // First check for workout recommendations specific to this user
    const { data: recommendations, error: recError } = await supabase
      .from("workout_recommendations")
      .select("workout_id")
      .eq("user_id", user.user.id)
      .limit(1);
      
    if (recError) {
      console.error("Erro ao buscar recomendações de treinos:", recError);
      return null;
    }
    
    // If there's a recommendation, return the workout ID
    if (recommendations && recommendations.length > 0) {
      console.log("Workout recommendation found:", recommendations[0].workout_id);
      return recommendations[0].workout_id;
    }
    
    // If no recommendation, check workout history
    const { data: history, error: histError } = await supabase
      .from("user_workout_history")
      .select("workout_id")
      .eq("user_id", user.user.id)
      .order("completed_at", { ascending: false })
      .limit(1);
      
    if (histError) {
      console.error("Erro ao buscar histórico de treinos:", histError);
      return null;
    }
    
    // If there's a workout in history, return that ID
    if (history && history.length > 0) {
      console.log("Recent workout from history:", history[0].workout_id);
      return history[0].workout_id;
    }
    
    // If no personalized workouts found
    return null;
  } catch (err) {
    console.error("Exception in personalized workout fetch:", err);
    return null;
  }
};

export const useWorkoutHistory = () => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ["workoutHistory"],
    queryFn: fetchWorkoutHistory,
    refetchOnWindowFocus: false,
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useUserPersonalizedWorkout = () => {
  return useQuery({
    queryKey: ["userPersonalizedWorkout"],
    queryFn: fetchUserPersonalizedWorkout,
    refetchOnWindowFocus: false,
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
