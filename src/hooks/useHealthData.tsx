import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface HealthData {
  id: string;
  user_id: string;
  date: string;
  steps?: number;
  heart_rate?: number;
  sleep_hours?: number;
  calories?: number;
  created_at: string;
}

export function useHealthData(startDate?: string, endDate?: string) {
  const [data, setData] = useState<HealthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('User not authenticated');
      }

      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      params.append('limit', '90'); // Get last 90 days by default

      const { data: healthData, error } = await supabase.functions.invoke('health-sync', {
        method: 'GET'
      });

      if (error) throw error;

      setData(healthData.data || []);
    } catch (err) {
      console.error('Error fetching health data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch health data');
      toast("Erro ao carregar dados - Não foi possível carregar os dados de saúde.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, [startDate, endDate]);

  const syncHealthData = async (healthData: Omit<HealthData, 'id' | 'user_id' | 'created_at'>[]) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('User not authenticated');
      }

      const { data: result, error } = await supabase.functions.invoke('health-sync', {
        body: healthData
      });

      if (error) throw error;

      toast(`Dados sincronizados - ${result.summary.successful} registros sincronizados com sucesso.`);

      // Refresh data after sync
      await fetchHealthData();
      
      return result;
    } catch (err) {
      console.error('Error syncing health data:', err);
      toast("Erro na sincronização - Não foi possível sincronizar os dados de saúde.");
      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    refetch: fetchHealthData,
    syncHealthData
  };
}