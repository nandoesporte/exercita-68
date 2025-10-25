import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RecipeRequest {
  objetivo: string;
  tempo_minutos: number;
  porcoes: number;
  restricoes?: string[];
  preferencias?: string[];
}

interface Recipe {
  id?: string;
  name: string;
  description: string;
  prep_time_minutes: number;
  servings: number;
  difficulty: 'facil' | 'medio' | 'dificil';
  ingredients: string[];
  instructions: string[];
  calories_per_serving: number;
  protein_per_serving: number;
  carbs_per_serving: number;
  fat_per_serving: number;
  tags: string[];
  created_by?: string;
  is_published?: boolean;
}

interface RecipeResponse {
  success: boolean;
  recipe: Recipe;
  error?: string;
}

export const useRecipeGenerator = () => {
  return useMutation({
    mutationFn: async (request: RecipeRequest): Promise<Recipe> => {
      const { data, error } = await supabase.functions.invoke('generate-recipe', {
        body: request
      });

      if (error) {
        console.error('Erro ao gerar receita:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao gerar receita');
      }

      return data.recipe;
    },
    onSuccess: () => {
      toast.success('Receita criada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao gerar receita:', error);
      toast.error('Não foi possível gerar a receita. Verifique sua conexão e tente novamente.');
    },
  });
};

export type { RecipeRequest, Recipe, RecipeResponse };
