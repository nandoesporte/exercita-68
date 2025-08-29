import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.ed6ff2f23934447facfe5011959465fb',
  appName: 'exercita-68',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    url: 'https://ed6ff2f2-3934-447f-acfe-5011959465fb.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;