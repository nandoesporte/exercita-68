import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface RunningPlanFormData {
  age: number;
  weight: number;
  fitness_level: 'iniciante' | 'intermediário' | 'avançado';
  goal: 'emagrecimento' | 'resistência' | 'velocidade' | 'saúde geral';
  available_time: string;
}

export interface RunningPlanItem {
  semana: number;
  dia: string;
  atividade: string;
  duracao_min: number;
  intensidade: string;
}

export interface RunningPlan {
  id: string;
  user_id: string;
  title: string;
  plan: RunningPlanItem[];
  age: number;
  weight: number;
  fitness_level: string;
  goal: string;
  available_time: string;
  created_at: string;
  updated_at: string;
}

export const useRunningPlans = () => {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch user's running plans
  const {
    data: plans,
    isLoading: isLoadingPlans,
    error: plansError,
  } = useQuery({
    queryKey: ['running-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('running_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching running plans:', error);
        throw error;
      }

      return data.map(item => ({
        ...item,
        plan: item.plan as unknown as RunningPlanItem[]
      })) as RunningPlan[];
    },
  });

  // Generate running plan with AI
  const generatePlan = async (formData: RunningPlanFormData): Promise<RunningPlanItem[]> => {
    setIsGenerating(true);
    
    try {
      console.log('Generating running plan with data:', formData);
      
      const { data, error } = await supabase.functions.invoke('generate-running-plan', {
        body: formData,
      });

      if (error) {
        console.error('Error generating plan:', error);
        throw new Error(error.message || 'Erro ao gerar plano');
      }

      if (!data?.plan) {
        console.error('Invalid response from generate-running-plan:', data);
        throw new Error('Resposta inválida do servidor');
      }

      console.log('Plan generated successfully:', data.plan);
      return data.plan;
    } catch (error) {
      console.error('Error in generatePlan:', error);
      const message = error instanceof Error ? error.message : 'Erro ao gerar plano';
      toast.error(message);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  // Save running plan
  const savePlanMutation = useMutation({
    mutationFn: async (planData: {
      title: string;
      plan: RunningPlanItem[];
      age: number;
      weight: number;
      fitness_level: string;
      goal: string;
      available_time: string;
    }) => {
      console.log('Saving running plan:', planData);
      
      const { data, error } = await supabase.functions.invoke('save-running-plan', {
        body: planData,
      });

      if (error) {
        console.error('Error saving plan:', error);
        throw new Error(error.message || 'Erro ao salvar plano');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['running-plans'] });
      toast.success('Plano de treino salvo com sucesso!');
    },
    onError: (error) => {
      console.error('Error in savePlanMutation:', error);
      const message = error instanceof Error ? error.message : 'Erro ao salvar plano';
      toast.error(message);
    },
  });

  // Delete running plan
  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase
        .from('running_plans')
        .delete()
        .eq('id', planId);

      if (error) {
        console.error('Error deleting plan:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['running-plans'] });
      toast.success('Plano excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Error in deletePlanMutation:', error);
      toast.error('Erro ao excluir plano');
    },
  });

  return {
    plans,
    isLoadingPlans,
    plansError,
    generatePlan,
    isGenerating,
    savePlan: savePlanMutation.mutate,
    isSavingPlan: savePlanMutation.isPending,
    deletePlan: deletePlanMutation.mutate,
    isDeletingPlan: deletePlanMutation.isPending,
  };
};