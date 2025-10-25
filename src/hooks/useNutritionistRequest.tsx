import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NutritionistRequestResponse {
  success: boolean;
  lead_id?: string;
  message?: string;
  error?: string;
}

export const useNutritionistRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<NutritionistRequestResponse> => {
      const { data, error } = await supabase.functions.invoke('request-nutritionist', {
        body: {}
      });

      if (error) {
        console.error('Erro ao solicitar nutricionista:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao processar solicitação');
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success('Solicitação enviada! Logo você receberá um retorno.');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: Error) => {
      console.error('Erro na solicitação:', error);
      toast.error('Não foi possível enviar. Verifique sua conexão e tente novamente.');
    },
  });
};
