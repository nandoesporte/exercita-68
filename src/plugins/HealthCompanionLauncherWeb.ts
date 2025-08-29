import { WebPlugin } from '@capacitor/core';
import type { HealthCompanionLauncherPlugin } from './HealthCompanionLauncher';

export class HealthCompanionLauncherWeb extends WebPlugin implements HealthCompanionLauncherPlugin {
  async launch(): Promise<{ success: boolean }> {
    console.log('Health Companion Launcher not available on web');
    return { success: false };
  }
}