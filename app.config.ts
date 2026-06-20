import type { ExpoConfig } from 'expo/config';

const androidMapsApiKey =
  process.env.GOOGLE_MAPS_ANDROID_API_KEY ?? process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const iosMapsApiKey =
  process.env.GOOGLE_MAPS_IOS_API_KEY ?? process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const placesApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

const config: ExpoConfig = {
  name: 'Kotuwa Driver',
  slug: 'navigation-poc',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  scheme: 'navigation-poc',
  plugins: [
    'expo-router',
    './plugins/withDisableGammaScreens',
    'expo-secure-store',
    'expo-audio',
    [
      'expo-image-picker',
      {
        cameraPermission: 'Allow Kotuwa Driver to take delivery proof photos.',
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          minSdkVersion: 24,
        },
        ios: {
          deploymentTarget: '16.4',
          buildReactNativeFromSource: true,
        },
      },
    ],
    './plugins/withIosSwiftUICoreFix',
    [
      './plugins/withGoogleNavigationSdk',
      {
        androidApiKey: androidMapsApiKey,
        iosApiKey: iosMapsApiKey,
      },
    ],
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.navigationpoc.app',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'This app needs your location to show your position on the map and provide turn-by-turn navigation.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'This app needs your location in the background to continue navigation guidance.',
      NSCameraUsageDescription:
        'This app needs camera access to attach delivery proof photos.',
      UIBackgroundModes: ['location', 'audio'],
    },
  },
  android: {
    package: 'com.navigationpoc.app',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'FOREGROUND_SERVICE',
      'FOREGROUND_SERVICE_LOCATION',
    ],
    config: {
      googleMaps: {
        apiKey: androidMapsApiKey,
      },
    },
  },
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    placesApiKey,
    router: {},
  },
};

export default config;
