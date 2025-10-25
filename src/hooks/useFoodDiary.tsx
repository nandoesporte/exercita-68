import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FoodDiaryEntry } from '@/types/nutrition';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const useFoodDiary = (date?: Date) => {
  const queryClient = useQueryClient();
  const dateStr = date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

  const { data: entries, isLoading } = useQuery({
    queryKey: ['food-diary', dateStr],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('food_diary_entries')
        .select('*, recipe:recipes(*)')
        .eq('user_id', user.id)
        .eq('entry_date', dateStr)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as FoodDiaryEntry[];
    },
  });

  const addEntry = useMutation({
    mutationFn: async (entry: Omit<Partial<FoodDiaryEntry>, 'user_id' | 'id' | 'created_at' | 'entry_date'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('food_diary_entries')
        .insert([{
          user_id: user.id,
          food_name: entry.food_name || '',
          meal_type: entry.meal_type || 'almoco',
          entry_date: dateStr,
          description: entry.description,
          quantity: entry.quantity,
          calories: entry.calories,
          protein: entry.protein,
          carbs: entry.carbs,
          fats: entry.fats,
          photo_url: entry.photo_url,
          notes: entry.notes,
          recipe_id: entry.recipe_id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data as unknown as FoodDiaryEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-diary', dateStr] });
      toast.success('Refeição registrada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao registrar refeição: ' + error.message);
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase
        .from('food_diary_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-diary', dateStr] });
      toast.success('Registro removido com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao remover registro: ' + error.message);
    },
  });

  const totalNutrition = entries?.reduce(
    (acc, entry) => ({
      calories: (acc.calories || 0) + (entry.calories || 0),
      protein: (acc.protein || 0) + (entry.protein || 0),
      carbs: (acc.carbs || 0) + (entry.carbs || 0),
      fats: (acc.fats || 0) + (entry.fats || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  return {
    entries,
    isLoading,
    addEntry,
    deleteEntry,
    totalNutrition,
  };
};