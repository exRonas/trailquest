/**
 * Client-side geo helpers for the navigation engine: great-circle distance,
 * radius checks for checkpoint triggers, and GPS-noise-smoothed speed.
 */

const EARTH_RADIUS_M = 6_371_000;

export interface LatLng {
  lat: number;
  lng: number;
}

const toRad = (deg: number): number => (deg * Math.PI) / 180;

export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function isWithinRadius(
  point: LatLng,
  target: LatLng,
  radiusM: number,
): boolean {
  return haversineMeters(point, target) <= radiusM;
}

export function pathDistanceMeters(points: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += haversineMeters(points[i - 1], points[i]);
  }
  return total;
}

export interface TimedPoint extends LatLng {
  /** epoch ms */
  t: number;
}

/**
 * Smoothed speed in km/h derived from the last `window` samples. Using a short
 * window (default 3) and dividing total distance by total time rejects the
 * jitter you'd get from a naive last-two-points delta.
 */
export function smoothedSpeedKmh(samples: TimedPoint[], window = 3): number {
  if (samples.length < 2) return 0;
  const slice = samples.slice(-window);
  let dist = 0;
  for (let i = 1; i < slice.length; i += 1) {
    dist += haversineMeters(slice[i - 1], slice[i]);
  }
  const dtSec = (slice[slice.length - 1].t - slice[0].t) / 1000;
  if (dtSec <= 0) return 0;
  const kmh = dist / 1000 / (dtSec / 3600);
  // Clamp absurd spikes from GPS teleports.
  return kmh > 0 && kmh < 250 ? kmh : 0;
}

/**
 * Fraction (0..1) of the route completed, estimated by snapping the current
 * position to the nearest polyline vertex and measuring distance along the path
 * up to that vertex.
 */
export function routeProgressFraction(
  current: LatLng,
  path: LatLng[],
): number {
  if (path.length < 2) return 0;

  let nearestIdx = 0;
  let nearestDist = Infinity;
  for (let i = 0; i < path.length; i += 1) {
    const d = haversineMeters(current, path[i]);
    if (d < nearestDist) {
      nearestDist = d;
      nearestIdx = i;
    }
  }

  const total = pathDistanceMeters(path);
  if (total === 0) return 0;
  const travelled = pathDistanceMeters(path.slice(0, nearestIdx + 1));
  return Math.max(0, Math.min(1, travelled / total));
}
