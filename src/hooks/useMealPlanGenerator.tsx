import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MealPlanRequest {
  user_profile: {
    peso_kg: number;
    altura_cm: number;
    idade: number;
    sexo: 'M' | 'F';
    atividade_fisica: string;
    objetivo: string;
  };
  preferencias?: string[];
  restricoes?: string[];
  calorias_alvo: number;
  macros: {
    proteina: { gramas: number; percentual: number };
    carboidrato: { gramas: number; percentual: number };
    gordura: { gramas: number; percentual: number };
  };
  refeicoes_por_dia?: number;
}

interface Refeicao {
  tipo: 'cafe_manha' | 'lanche_manha' | 'almoco' | 'lanche_tarde' | 'jantar' | 'ceia';
  nome: string;
  recipe_id?: string;
  porcoes?: number;
  calorias: number;
  proteina: number;
  carboidrato: number;
  gordura: number;
  ingredientes?: string[];
  preparo?: string;
}

interface DiaPlano {
  dia: string;
  refeicoes: Refeicao[];
  totais: {
    calorias: number;
    proteina: number;
    carboidrato: number;
    gordura: number;
  };
}

interface PlanoSemanal {
  dias: DiaPlano[];
}

interface MealPlanResponse {
  success: boolean;
  plano: PlanoSemanal;
  totais_semana: {
    calorias: number;
    proteina: number;
    carboidrato: number;
    gordura: number;
  };
  medias_diarias: {
    calorias: number;
    proteina: number;
    carboidrato: number;
    gordura: number;
  };
  metas: {
    calorias_alvo: number;
    macros: MealPlanRequest['macros'];
  };
}

export const useMealPlanGenerator = () => {
  return useMutation({
    mutationFn: async (request: MealPlanRequest): Promise<MealPlanResponse> => {
      const { data, error } = await supabase.functions.invoke('generate-meal-plan', {
        body: request
      });

      if (error) {
        console.error('Erro ao gerar plano:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao gerar plano semanal');
      }

      return data;
    },
    onSuccess: () => {
      toast.success('Plano criado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao gerar plano:', error);
      toast.error('Não foi possível gerar o plano. Verifique sua conexão e tente novamente.');
    },
  });
};

export type { MealPlanRequest, MealPlanResponse, PlanoSemanal, DiaPlano, Refeicao };
