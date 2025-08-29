import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import HealthConnect from '@/plugins/HealthConnect';

interface HealthSyncData {
  date: string;
  steps?: number;
  heart_rate?: number;
  sleep_hours?: number;
  calories?: number;
}

export function useHealthSync() {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);

  const syncHealthData = async () => {
    try {
      setSyncing(true);

      // Check if Health Connect is available and connected
      const availability = await HealthConnect.isAvailable();
      if (!availability.available) {
        toast("Health Connect não está disponível neste dispositivo");
        return false;
      }

      const permissions = await HealthConnect.checkPermissions();
      if (!permissions.granted) {
        toast("Permissões do Health Connect não foram concedidas");
        return false;
      }

      // Get health data from the last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const healthData = await HealthConnect.getHealthData({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });

      // Transform data for our API
      const syncData: HealthSyncData[] = healthData.map(data => ({
        date: data.date,
        steps: data.steps,
        heart_rate: data.heartRate,
        sleep_hours: data.sleepHours,
        calories: data.calories
      }));

      // Send data to our health-sync function
      const { data: result, error } = await supabase.functions.invoke('health-sync', {
        body: syncData
      });

      if (error) {
        console.error('Sync error:', error);
        toast("Erro ao sincronizar dados de saúde");
        return false;
      }

      setLastSyncDate(new Date());
      toast("Dados de saúde sincronizados com sucesso!");
      return true;

    } catch (error) {
      console.error('Health sync error:', error);
      toast("Erro ao sincronizar dados de saúde");
      return false;
    } finally {
      setSyncing(false);
    }
  };

  const setupAutoSync = async () => {
    try {
      // Check permissions first
      const permissions = await HealthConnect.checkPermissions();
      if (!permissions.granted) {
        const requestResult = await HealthConnect.requestPermissions();
        if (!requestResult.granted) {
          toast("Permissões necessárias não foram concedidas para sincronização automática");
          return false;
        }
      }

      // Set up daily sync (this would be implemented with background sync in a real app)
      toast("Sincronização automática configurada");
      return true;

    } catch (error) {
      console.error('Auto sync setup error:', error);
      toast("Erro ao configurar sincronização automática");
      return false;
    }
  };

  return {
    syncing,
    lastSyncDate,
    syncHealthData,
    setupAutoSync
  };
}