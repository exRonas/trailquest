import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation, {
  GeolocationResponse,
} from '@react-native-community/geolocation';

/**
 * Thin wrapper around @react-native-community/geolocation (free, MIT). Exposes
 * the same surface the rest of the app already consumes (configure / request
 * permission / start a tracking session / one-shot position) so callers didn't
 * need to change when we migrated off the commercial background-geolocation
 * plugin.
 *
 * PHASE 1 (current): foreground tracking — works while the app is open. Reliable
 * screen-off/background tracking needs a foreground service; that's added in a
 * follow-up (see configureTracking's enableBackgroundLocationUpdates note).
 */

export type LocationSample = {
  lat: number;
  lng: number;
  /** metres/second from the OS, or null if unavailable. */
  speedMps: number | null;
  /** degrees, or null. */
  heading: number | null;
  altitudeM: number | null;
  accuracyM: number;
  timestamp: string;
};

export type LocationAuth = 'always' | 'whenInUse' | 'denied';

let configured = false;

function toSample(pos: GeolocationResponse): LocationSample {
  const c = pos.coords;
  return {
    lat: c.latitude,
    lng: c.longitude,
    speedMps: typeof c.speed === 'number' && c.speed >= 0 ? c.speed : null,
    heading: typeof c.heading === 'number' && c.heading >= 0 ? c.heading : null,
    altitudeM: typeof c.altitude === 'number' ? c.altitude : null,
    accuracyM: c.accuracy ?? 0,
    timestamp: new Date(pos.timestamp).toISOString(),
  };
}

/** Configure the geolocation module exactly once. */
export function configureTracking(): void {
  if (configured) return;
  Geolocation.setRNConfiguration({
    // We request permissions ourselves (below) so we can map the result to our
    // own LocationAuth and avoid the library's iOS-centric prompt flow.
    skipPermissionRequests: true,
    authorizationLevel: 'whenInUse',
    // Use Google Play Services (fused provider) when available — more accurate
    // and battery-friendly than the raw Android LocationManager; falls back
    // automatically on devices without Play Services.
    locationProvider: 'auto',
    // Phase 1: foreground only. A foreground service (Phase 2) flips this on
    // so updates keep flowing with the screen off.
    enableBackgroundLocationUpdates: false,
  });
  configured = true;
}

/** Prompt for location permission. Returns the granted level. */
export async function requestLocationPermission(): Promise<LocationAuth> {
  configureTracking();
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location permission',
        message: 'TrailQuest needs your location to guide you along the route.',
        buttonPositive: 'OK',
      },
    );
    // A foreground-service-based hike only needs "while using the app", so a
    // plain FINE_LOCATION grant maps to whenInUse.
    return result === PermissionsAndroid.RESULTS.GRANTED ? 'whenInUse' : 'denied';
  }
  // iOS: defer to the library's own prompt.
  return new Promise<LocationAuth>((resolve) => {
    Geolocation.requestAuthorization(
      () => resolve('whenInUse'),
      () => resolve('denied'),
    );
  });
}

export async function getLocationAuthStatus(): Promise<LocationAuth> {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    return granted ? 'whenInUse' : 'denied';
  }
  // No reliable synchronous check on iOS without prompting; assume whenInUse.
  return 'whenInUse';
}

/**
 * Start a tracking session. Returns an unsubscribe function that stops tracking
 * and removes the watch.
 */
export async function startTracking(
  onLocation: (sample: LocationSample) => void,
  onError?: (error: unknown) => void,
): Promise<() => Promise<void>> {
  configureTracking();

  const watchId = Geolocation.watchPosition(
    (pos) => onLocation(toSample(pos)),
    (err) => onError?.(err),
    {
      enableHighAccuracy: true,
      distanceFilter: 8, // metres between updates
      interval: 3000, // preferred update interval (ms)
      fastestInterval: 2000, // fastest the app can handle (ms)
    },
  );

  // Emit an immediate fix so the UI doesn't sit empty until the first movement.
  Geolocation.getCurrentPosition(
    (pos) => onLocation(toSample(pos)),
    () => {
      // Non-fatal: the watch will deliver fixes shortly.
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
  );

  return async () => {
    Geolocation.clearWatch(watchId);
  };
}

/**
 * One-shot current position (e.g. centring the Explore map, "nearby routes").
 * Deliberately NOT high-accuracy: that forces a raw GPS satellite fix, which
 * can take 15s+ or never resolve indoors/underground. This use case only
 * needs city-level precision, so we accept the network/fused provider's
 * cached fix (near-instant) — a stale-but-recent location beats an accurate
 * one that times out to null.
 */
export async function getCurrentPosition(): Promise<LocationSample | null> {
  configureTracking();
  return new Promise((resolve) => {
    Geolocation.getCurrentPosition(
      (pos) => resolve(toSample(pos)),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60_000 },
    );
  });
}
