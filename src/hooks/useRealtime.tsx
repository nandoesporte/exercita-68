import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface UseRealtimeOptions {
  table: string;
  queryKey: (string | number | null | undefined)[];
  enabled?: boolean;
}

export const useRealtime = ({ table, queryKey, enabled = true }: UseRealtimeOptions) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    console.log(`Setting up realtime for table: ${table}, queryKey:`, queryKey);

    const channel = supabase
      .channel(`public:${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log(`Realtime ${payload.eventType} for ${table}:`, payload);
          
          // Invalidar queries relacionadas
          queryClient.invalidateQueries({ queryKey });
          
          // Também invalidar queries mais específicas se necessário
          if (payload.eventType === 'INSERT' && payload.new) {
            // Para novos registros, invalidar queries que podem incluir esse registro
            queryClient.invalidateQueries({ queryKey: [table] });
          }
          
          if (payload.eventType === 'UPDATE' && payload.new) {
            // Para atualizações, invalidar queries específicas do item
            queryClient.invalidateQueries({ queryKey: [table, payload.new.id] });
            queryClient.invalidateQueries({ queryKey: [table] });
          }
          
          if (payload.eventType === 'DELETE' && payload.old) {
            // Para exclusões, invalidar queries que podem ter incluído esse registro
            queryClient.invalidateQueries({ queryKey: [table, payload.old.id] });
            queryClient.invalidateQueries({ queryKey: [table] });
          }
        }
      )
      .subscribe((status) => {
        console.log(`Realtime status for ${table}:`, status);
      });

    return () => {
      console.log(`Cleaning up realtime for table: ${table}`);
      supabase.removeChannel(channel);
    };
  }, [table, queryClient, enabled, JSON.stringify(queryKey)]);
};

// Hook específico para appointments
export const useAppointmentsRealtime = (enabled = true) => {
  return useRealtime({
    table: 'appointments',
    queryKey: ['admin-appointments'],
    enabled,
  });
};

// Hook específico para workouts
export const useWorkoutsRealtime = (enabled = true) => {
  return useRealtime({
    table: 'workouts',
    queryKey: ['admin-workouts'],
    enabled,
  });
};

// Hook específico para user workout history
export const useWorkoutHistoryRealtime = (enabled = true) => {
  return useRealtime({
    table: 'user_workout_history',
    queryKey: ['workoutHistory'],
    enabled,
  });
};

// Hook específico para exercises
export const useExercisesRealtime = (enabled = true) => {
  return useRealtime({
    table: 'exercises',
    queryKey: ['admin-exercises'],
    enabled,
  });
};

// Hook específico para products
export const useProductsRealtime = (enabled = true) => {
  return useRealtime({
    table: 'products',
    queryKey: ['admin-products'],
    enabled,
  });
};

// Hook específico para profiles
export const useProfilesRealtime = (enabled = true) => {
  return useRealtime({
    table: 'profiles',
    queryKey: ['users-by-admin'],
    enabled,
  });
};