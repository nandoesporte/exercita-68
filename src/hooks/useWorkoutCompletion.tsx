
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdminPermissionsContext } from '@/hooks/useAdminPermissionsContext';

interface CompleteWorkoutData {
  workoutId: string;
  duration?: number;
  caloriesBurned?: number;
  rating?: number;
  notes?: string;
}

export const useWorkoutCompletion = () => {
  const queryClient = useQueryClient();
  const { adminId } = useAdminPermissionsContext();

  return useMutation({
    mutationFn: async (data: CompleteWorkoutData) => {
      console.log("Completing workout with data:", data);
      
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        throw new Error("Usuário não autenticado");
      }

      // Insert workout completion record
      const { data: completionData, error } = await supabase
        .from("user_workout_history")
        .insert({
          user_id: user.user.id,
          workout_id: data.workoutId,
          completed_at: new Date().toISOString(),
          duration: data.duration || null,
          calories_burned: data.caloriesBurned || null,
          rating: data.rating || null,
          notes: data.notes || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error completing workout:", error);
        throw new Error("Erro ao registrar conclusão do treino");
      }

      console.log("Workout completed successfully:", completionData);
      return completionData;
    },
    onSuccess: () => {
      // Invalidate workout history to refresh the data
      queryClient.invalidateQueries({ queryKey: ["workoutHistory", adminId] });
      toast.success("Treino concluído com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Failed to complete workout:", error);
      toast.error(error.message || "Erro ao concluir treino");
    },
  });
};
