import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Workout = Database['public']['Tables']['workouts']['Row'] & {
  category?: Database['public']['Tables']['workout_categories']['Row'] | null;
  days_of_week?: string[];
};

export function useFeaturedWorkouts() {
  return useQuery({
    queryKey: ['featured-workouts'],
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
          )
        `)
        .eq('is_featured', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(`Error fetching featured workouts: ${error.message}`);
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
