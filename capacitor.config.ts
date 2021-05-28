import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.kraftmaschine',
  appName: 'kraftmaschine',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: "http://192.168.1.20:8881",
    cleartext: true
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 0,
      "launchAutoHide": true,
      "backgroundColor": "#ffffffff",
      "androidSplashResourceName": "splash",
      "splashFullScreen": true,
      "splashImmersive": true
    }
  } 
};

export default config;
