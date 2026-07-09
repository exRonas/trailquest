import Mapbox from '@rnmapbox/maps';
import { config, hasMapboxToken } from '../config/env';
import { useIsDark } from '../theme/useThemeColors';

/**
 * Initialise the Mapbox SDK once at app start. If no public token is configured
 * the map screens fall back to a documented placeholder (see hasMapboxToken).
 */
let initialised = false;

export function initMapbox(): void {
  if (initialised) return;
  if (hasMapboxToken) {
    Mapbox.setAccessToken(config.mapboxToken);
  }
  // Telemetry off by default for privacy.
  Mapbox.setTelemetryEnabled(false);
  initialised = true;
}

export { hasMapboxToken };
export const mapStyleUrl = config.mapboxStyleUrl;
/** Dark-theme counterpart, used instead of `mapStyleUrl` when the app is in
 *  dark mode — Mapbox's own outdoors style stays light regardless of app theme. */
export const darkMapStyleUrl = 'mapbox://styles/mapbox/dark-v11';

/** The map style to use for the current theme (light: configured outdoors
 *  style; dark: Mapbox's dark style). Use this instead of `mapStyleUrl`
 *  directly on any screen with a MapView. */
export function useMapStyleUrl(): string {
  const isDark = useIsDark();
  return isDark ? darkMapStyleUrl : mapStyleUrl;
}

/** Default camera shown briefly before routes load / the camera fits to the
 *  markers. Centred on Pavlodar (the app's home region) — NOT a world/US
 *  default, so a remount of the MapView never flashes the map halfway across
 *  the planet. */
export const DEFAULT_CAMERA = {
  centerCoordinate: [76.9674, 52.2873] as [number, number],
  zoomLevel: 5,
};
