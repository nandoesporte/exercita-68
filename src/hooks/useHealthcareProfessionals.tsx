import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { HealthcareProfessional, AppointmentWithProfessional } from '@/types/healthcare';
import { toast } from 'sonner';

export function useHealthcareProfessionals(specialty?: string) {
  return useQuery({
    queryKey: ['healthcare-professionals', specialty],
    queryFn: async () => {
      let query = supabase
        .from('healthcare_professionals')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (specialty) {
        query = query.eq('specialty', specialty);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as HealthcareProfessional[];
    },
  });
}

export function useHealthcareProfessional(id: string) {
  return useQuery({
    queryKey: ['healthcare-professional', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('healthcare_professionals')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as HealthcareProfessional;
    },
    enabled: !!id,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointment: {
      professional_id: string;
      appointment_date: string;
      duration: number;
      title: string;
      description?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          professional_id: appointment.professional_id,
          appointment_date: appointment.appointment_date,
          duration: appointment.duration,
          title: appointment.title,
          description: appointment.description,
          user_id: user.id,
          status: 'scheduled',
          trainer_name: '', // Legacy field - can be removed in future migration
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments-with-professionals'] });
      toast.success('Consulta agendada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao agendar consulta: ${error.message}`);
    },
  });
}

export function useAppointmentsWithProfessionals() {
  return useQuery({
    queryKey: ['appointments-with-professionals'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { upcoming: [], past: [] };

      const now = new Date().toISOString();

      // Get upcoming appointments
      const { data: upcoming, error: upcomingError } = await supabase
        .from('appointments')
        .select('*, healthcare_professionals(*)')
        .eq('user_id', user.id)
        .gte('appointment_date', now)
        .order('appointment_date', { ascending: true });

      if (upcomingError) throw upcomingError;

      // Get past appointments
      const { data: past, error: pastError } = await supabase
        .from('appointments')
        .select('*, healthcare_professionals(*)')
        .eq('user_id', user.id)
        .lt('appointment_date', now)
        .order('appointment_date', { ascending: false });

      if (pastError) throw pastError;

      return {
        upcoming: upcoming as AppointmentWithProfessional[],
        past: past as AppointmentWithProfessional[],
      };
    },
  });
}

// Admin hooks
export function useAdminHealthcareProfessionals() {
  return useQuery({
    queryKey: ['admin-healthcare-professionals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('healthcare_professionals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as HealthcareProfessional[];
    },
  });
}

export function useCreateHealthcareProfessional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (professional: Omit<HealthcareProfessional, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('healthcare_professionals')
        .insert(professional)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-healthcare-professionals'] });
      queryClient.invalidateQueries({ queryKey: ['healthcare-professionals'] });
      toast.success('Profissional cadastrado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao cadastrar profissional: ${error.message}`);
    },
  });
}

export function useUpdateHealthcareProfessional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HealthcareProfessional> & { id: string }) => {
      const { data, error } = await supabase
        .from('healthcare_professionals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-healthcare-professionals'] });
      queryClient.invalidateQueries({ queryKey: ['healthcare-professionals'] });
      toast.success('Profissional atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar profissional: ${error.message}`);
    },
  });
}

export function useDeleteHealthcareProfessional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First, remove references in appointments
      const { error: appointmentsError } = await supabase
        .from('appointments')
        .update({ professional_id: null })
        .eq('professional_id', id);

      if (appointmentsError) throw appointmentsError;

      // Then delete the professional
      const { error } = await supabase
        .from('healthcare_professionals')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-healthcare-professionals'] });
      queryClient.invalidateQueries({ queryKey: ['healthcare-professionals'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments-with-professionals'] });
      toast.success('Profissional removido com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao remover profissional: ${error.message}`);
    },
  });
}
