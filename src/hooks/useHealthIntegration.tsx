import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import HealthConnect from '@/plugins/HealthConnect';

declare global {
  interface Window {
    gapi?: any;
    AppleHealthKit?: any;
  }
}

export interface GoogleFitPermissions {
  scopes: string[];
}

export interface AppleHealthKitPermissions {
  permissions: {
    read: string[];
  };
}

export function useHealthIntegration() {
  const [isHealthConnectConnected, setIsHealthConnectConnected] = useState(false);
  const [isAppleHealthKitConnected, setIsAppleHealthKitConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  // Health Connect Integration (Android)
  const connectHealthConnect = async () => {
    try {
      setLoading(true);

      // Check if Health Connect is available
      const availability = await HealthConnect.isAvailable();
      if (!availability.available) {
        toast("Health Connect não está disponível neste dispositivo");
        return;
      }

      // Request permissions
      const permissions = await HealthConnect.requestPermissions();
      if (permissions.granted) {
        setIsHealthConnectConnected(true);
        toast("Health Connect conectado - Agora você pode sincronizar seus dados de saúde.");
      } else {
        toast("Permissões necessárias não foram concedidas");
      }
    } catch (error) {
      console.error('Health Connect connection error:', error);
      toast("Erro na conexão - Não foi possível conectar com o Health Connect.");
    } finally {
      setLoading(false);
    }
  };

  const loadGoogleAPI = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google API'));
      document.head.appendChild(script);
    });
  };

  const fetchHealthConnectData = async (startDate: Date, endDate: Date) => {
    if (!isHealthConnectConnected) {
      throw new Error('Health Connect not connected');
    }

    try {
      setLoading(true);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const healthData = await HealthConnect.getHealthData({
        startDate: startDateStr,
        endDate: endDateStr
      });

      return healthData;
    } catch (error) {
      console.error('Error fetching Health Connect data:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Apple HealthKit Integration (for iOS PWA)
  const connectAppleHealthKit = async () => {
    try {
      setLoading(true);

      if (!window.AppleHealthKit) {
        throw new Error('Apple HealthKit not available. This feature requires iOS.');
      }

      const permissions: AppleHealthKitPermissions = {
        permissions: {
          read: [
            'StepCount',
            'HeartRate',
            'SleepAnalysis',
            'ActiveEnergyBurned'
          ]
        }
      };

      window.AppleHealthKit.initHealthKit(permissions, (result: any) => {
        if (result) {
          setIsAppleHealthKitConnected(true);
          toast("Apple HealthKit conectado - Agora você pode sincronizar seus dados de saúde.");
        }
      });
    } catch (error) {
      console.error('Apple HealthKit connection error:', error);
      toast("Erro na conexão - Não foi possível conectar com o Apple HealthKit.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAppleHealthKitData = async (startDate: Date, endDate: Date) => {
    if (!isAppleHealthKitConnected || !window.AppleHealthKit) {
      throw new Error('Apple HealthKit not connected');
    }

    try {
      setLoading(true);

      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };

      const promises = [
        new Promise((resolve, reject) => {
          window.AppleHealthKit.getStepCount(options, (err: any, results: any) => {
            if (err) reject(err);
            else resolve(results);
          });
        }),
        new Promise((resolve, reject) => {
          window.AppleHealthKit.getHeartRateSamples(options, (err: any, results: any) => {
            if (err) reject(err);
            else resolve(results);
          });
        }),
        new Promise((resolve, reject) => {
          window.AppleHealthKit.getSleepSamples(options, (err: any, results: any) => {
            if (err) reject(err);
            else resolve(results);
          });
        }),
        new Promise((resolve, reject) => {
          window.AppleHealthKit.getActiveEnergyBurned(options, (err: any, results: any) => {
            if (err) reject(err);
            else resolve(results);
          });
        })
      ];

      const [steps, heartRate, sleep, calories] = await Promise.all(promises);
      
      const healthData = processAppleHealthKitData(steps, heartRate, sleep, calories);
      return healthData;
    } catch (error) {
      console.error('Error fetching Apple HealthKit data:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const processGoogleFitData = (stepsData: any, heartRateData: any) => {
    // Process Google Fit data and convert to our format
    const processedData: any[] = [];
    
    // This is a simplified version - you'll need to implement proper data processing
    // based on Google Fit API response format
    
    return processedData;
  };

  const processAppleHealthKitData = (steps: any, heartRate: any, sleep: any, calories: any) => {
    // Process Apple HealthKit data and convert to our format
    const processedData: any[] = [];
    
    // This is a simplified version - you'll need to implement proper data processing
    // based on Apple HealthKit response format
    
    return processedData;
  };

  const disconnect = () => {
    setIsHealthConnectConnected(false);
    setIsAppleHealthKitConnected(false);
    
    toast("Desconectado - Integração com serviços de saúde desconectada.");
  };

  const syncHealthData = async () => {
    try {
      setLoading(true);
      const result = await HealthConnect.syncHealthData();
      if (result.success) {
        toast("Dados de saúde sincronizados com sucesso!");
      } else {
        toast("Erro ao sincronizar dados de saúde");
      }
      return result;
    } catch (error) {
      console.error('Error syncing health data:', error);
      toast("Erro ao sincronizar dados de saúde");
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    isHealthConnectConnected,
    isAppleHealthKitConnected,
    loading,
    connectHealthConnect,
    connectAppleHealthKit,
    fetchHealthConnectData,
    fetchAppleHealthKitData,
    syncHealthData,
    disconnect
  };
}