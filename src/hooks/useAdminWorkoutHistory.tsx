import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminPermissionsContext } from '@/hooks/useAdminPermissionsContext';

export type AdminWorkoutHistoryItem = {
  id: string;
  user_id: string;
  workout_id: string;
  completed_at: string;
  duration: number | null;
  calories_burned: number | null;
  rating: number | null;
  notes: string | null;
  user: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
  workout: {
    id: string;
    title: string;
    level: string;
    duration: number;
    calories: number;
    image_url: string | null;
    category?: {
      id: string;
      name: string;
      color: string;
    } | null;
  };
};

export const fetchAdminWorkoutHistory = async (adminId: string | null, isSuperAdmin: boolean): Promise<AdminWorkoutHistoryItem[]> => {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error("Usuário não autenticado");
  }
  
  // Verificar se o usuário é admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.user.id)
    .single();

  if (!profile?.is_admin && !isSuperAdmin) {
    throw new Error("Acesso negado: privilégios de administrador necessários");
  }
  
  // Super admins veem todos os históricos, admins normais só veem dos seus usuários
  let query = supabase
    .from("user_workout_history")
    .select(`
      id,
      user_id,
      workout_id,
      completed_at,
      duration,
      calories_burned,
      rating,
      notes,
      user:profiles!user_workout_history_user_id_fkey (
        id,
        first_name,
        last_name,
        avatar_url
      ),
      workout:workouts (
        id,
        title,
        level,
        duration,
        calories,
        image_url,
        category:workout_categories (
          id,
          name,
          color
        )
      )
    `)
    .order('completed_at', { ascending: false });

  // Se não é super admin, filtrar apenas usuários vinculados ao admin
  if (!isSuperAdmin && adminId) {
    // Buscar usuários vinculados a este admin
    const { data: userIds, error: usersError } = await supabase
      .from('profiles')
      .select('id')
      .eq('admin_id', adminId);

    if (usersError) {
      throw new Error(`Erro ao buscar usuários: ${usersError.message}`);
    }

    if (userIds && userIds.length > 0) {
      const userIdsList = userIds.map(u => u.id);
      query = query.in('user_id', userIdsList);
    } else {
      // Se o admin não tem usuários vinculados, retorna array vazio
      return [];
    }
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar histórico de treinos: ${error.message}`);
  }

  return data || [];
};

export const useAdminWorkoutHistory = () => {
  const { adminId, isSuperAdmin, isAdmin } = useAdminPermissionsContext();
  
  return useQuery({
    queryKey: ["admin-workout-history", adminId],
    queryFn: () => fetchAdminWorkoutHistory(adminId, isSuperAdmin),
    enabled: isAdmin && (!!adminId || isSuperAdmin),
  });
};