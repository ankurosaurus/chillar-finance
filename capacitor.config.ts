import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chillar.finance',
  appName: 'Chillar',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
