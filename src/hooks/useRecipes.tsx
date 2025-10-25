import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Recipe } from '@/types/nutrition';

export const useRecipes = (tags?: string[]) => {
  return useQuery({
    queryKey: ['recipes', tags],
    queryFn: async () => {
      let query = supabase
        .from('recipes')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (tags && tags.length > 0) {
        query = query.contains('tags', tags);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Recipe[];
    },
  });
};