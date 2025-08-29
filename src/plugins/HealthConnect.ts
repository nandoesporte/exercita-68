import { registerPlugin } from '@capacitor/core';

export interface HealthConnectPlugin {
  /**
   * Check if Health Connect is available on the device
   */
  isAvailable(): Promise<{ available: boolean }>;

  /**
   * Request permissions for Health Connect
   */
  requestPermissions(): Promise<{ granted: boolean }>;

  /**
   * Check current permissions status
   */
  checkPermissions(): Promise<{ granted: boolean }>;

  /**
   * Get health data for a date range
   */
  getHealthData(options: {
    startDate: string;
    endDate: string;
  }): Promise<{
    steps?: number;
    heartRate?: number;
    sleepHours?: number;
    calories?: number;
    date: string;
  }[]>;

  /**
   * Sync health data to server
   */
  syncHealthData(): Promise<{ success: boolean; message?: string }>;
}

const HealthConnect = registerPlugin<HealthConnectPlugin>('HealthConnect', {
  web: () => import('./HealthConnectWeb').then(m => new m.HealthConnectWeb()),
});

export default HealthConnect;