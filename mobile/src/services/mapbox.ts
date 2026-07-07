import Mapbox from '@rnmapbox/maps';
import { config, hasMapboxToken } from '../config/env';

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

/** Sensible default camera (centre of contiguous US) before routes load. */
export const DEFAULT_CAMERA = {
  centerCoordinate: [-98.5, 39.8] as [number, number],
  zoomLevel: 3,
};
