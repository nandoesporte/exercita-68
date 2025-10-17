import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.ed6ff2f23934447facfe5011959465fb',
  appName: 'ILIVI',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Comment out URL for production APK builds
    // url: 'https://ed6ff2f2-3934-447f-acfe-5011959465fb.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    },
    HealthConnect: {
      androidPackage: 'app.lovable.ed6ff2f23934447facfe5011959465fb.HealthConnectPlugin'
    },
    HealthCompanionLauncher: {
      androidPackage: 'app.lovable.ed6ff2f23934447facfe5011959465fb.HealthCompanionLauncherPlugin'
    }
  }
};

export default config;