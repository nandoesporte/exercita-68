import { registerPlugin } from '@capacitor/core';

export interface HealthCompanionLauncherPlugin {
  /**
   * Launch the Health Companion Activity with JWT token
   */
  launch(options: { jwtToken: string }): Promise<{ success: boolean }>;
}

const HealthCompanionLauncher = registerPlugin<HealthCompanionLauncherPlugin>('HealthCompanionLauncher', {
  web: () => import('./HealthCompanionLauncherWeb').then(m => new m.HealthCompanionLauncherWeb()),
});

export default HealthCompanionLauncher;