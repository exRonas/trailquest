import {
  API_URL as ENV_API_URL,
  MAPBOX_PUBLIC_TOKEN as ENV_MAPBOX_TOKEN,
  MAPBOX_STYLE_URL as ENV_MAPBOX_STYLE,
} from '@env';
import { Platform } from 'react-native';

/**
 * Centralised, typed access to build-time configuration. Falls back to sensible
 * development defaults so the app boots even before a .env is filled in.
 */

const defaultApiUrl = Platform.select({
  // Android emulator maps the host loopback to 10.0.2.2.
  android: 'http://10.0.2.2:4000/api',
  ios: 'http://localhost:4000/api',
  default: 'http://localhost:4000/api',
});

export const config = {
  apiUrl: ENV_API_URL ?? defaultApiUrl!,
  mapboxToken: ENV_MAPBOX_TOKEN ?? '',
  mapboxStyleUrl: ENV_MAPBOX_STYLE ?? 'mapbox://styles/mapbox/outdoors-v12',
} as const;

export const hasMapboxToken = config.mapboxToken.startsWith('pk.');
