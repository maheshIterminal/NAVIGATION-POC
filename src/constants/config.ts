import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const PLACES_API_KEY =
  Constants.expoConfig?.extra?.placesApiKey ??
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ??
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ??
  '';

const defaultHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? `http://${defaultHost}:3001`;

export const WS_URL =
  process.env.EXPO_PUBLIC_WS_URL ?? `ws://${defaultHost}:3001/ws/driver`;

export const AUTH_TOKEN_KEY = 'kotuwa_driver_token';
export const AUTH_DRIVER_KEY = 'kotuwa_driver_profile';

