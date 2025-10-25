import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { NutritionProfile } from '@/types/nutrition';
import { toast } from 'sonner';

export const useNutritionProfile = () => {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['nutrition-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('nutrition_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as NutritionProfile | null;
    },
  });

  const calculateMetrics = useMutation({
    mutationFn: async (input: {
      weight: number;
      height: number;
      age: number;
      gender: string;
      activityLevel: string;
      goal: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('calculate-nutrition-metrics', {
        body: input,
      });

      if (error) throw error;
      return data;
    },
  });

  const createProfile = useMutation({
    mutationFn: async (profileData: Omit<Partial<NutritionProfile>, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('nutrition_profiles')
        .insert([{
          user_id: user.id,
          weight: profileData.weight!,
          height: profileData.height!,
          age: profileData.age!,
          gender: profileData.gender!,
          goal: profileData.goal!,
          activity_level: profileData.activity_level!,
          allergies: profileData.allergies,
          restrictions: profileData.restrictions,
          bmi: profileData.bmi,
          bmr: profileData.bmr,
          daily_calories: profileData.daily_calories,
          daily_protein: profileData.daily_protein,
          daily_carbs: profileData.daily_carbs,
          daily_fats: profileData.daily_fats,
        }])
        .select()
        .single();

      if (error) throw error;
      return data as unknown as NutritionProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-profile'] });
      toast.success('Perfil salvo com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar perfil: ' + error.message);
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (profileData: Partial<NutritionProfile>) => {
      if (!profile?.id) throw new Error('Perfil não encontrado');

      const { data, error } = await supabase
        .from('nutrition_profiles')
        .update(profileData)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-profile'] });
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar perfil: ' + error.message);
    },
  });

  return {
    profile,
    isLoading,
    calculateMetrics,
    createProfile,
    updateProfile,
  };
};