import { WebPlugin } from '@capacitor/core';
import type { HealthConnectPlugin } from './HealthConnect';

export class HealthConnectWeb extends WebPlugin implements HealthConnectPlugin {
  async isAvailable(): Promise<{ available: boolean }> {
    console.log('Health Connect is not available on web');
    return { available: false };
  }

  async requestPermissions(): Promise<{ granted: boolean }> {
    console.log('Health Connect permissions not available on web');
    return { granted: false };
  }

  async checkPermissions(): Promise<{ granted: boolean }> {
    console.log('Health Connect permissions not available on web');
    return { granted: false };
  }

  async getHealthData(): Promise<any[]> {
    console.log('Health Connect data not available on web');
    return [];
  }

  async syncHealthData(): Promise<{ success: boolean; message?: string }> {
    console.log('Health Connect sync not available on web');
    return { success: false, message: 'Not available on web' };
  }
}