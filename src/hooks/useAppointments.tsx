
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Database } from '@/integrations/supabase/types';
import { useAdminPermissionsContext } from '@/hooks/useAdminPermissionsContext';

type Appointment = Database['public']['Tables']['appointments']['Row'];

export function useAppointments() {
  const { user } = useAuth();
  const { adminId, isSuperAdmin, isAdmin } = useAdminPermissionsContext();
  
  return useQuery({
    queryKey: ['appointments', user?.id, adminId],
    queryFn: async () => {
      if (!user) throw new Error('User must be logged in');
      
      let query = supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true });

      if (isAdmin && !isSuperAdmin) {
        // Admin sees appointments from their managed users or their own appointments
        query = query.or(`user_id.eq.${user.id},admin_id.eq.${adminId}`);
      } else if (!isAdmin) {
        // Regular users see only their own appointments
        query = query.eq('user_id', user.id);
      }
      // Super admin sees all appointments (no filter)
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Error fetching appointments: ${error.message}`);
      }
      
      const now = new Date();
      const upcoming = data.filter(
        appointment => new Date(appointment.appointment_date) >= now
      );
      
      const past = data.filter(
        appointment => new Date(appointment.appointment_date) < now
      );
      
      return { upcoming, past };
    },
    enabled: !!user && !!adminId,
  });
}
