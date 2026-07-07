/**
 * Geo helpers built around the Haversine great-circle distance. Used both for
 * server-side checkpoint verification and for deriving distance/speed from a
 * recorded GPS path log.
 */

const EARTH_RADIUS_M = 6_371_000; // mean Earth radius in metres

export interface LatLng {
  lat: number;
  lng: number;
}

export interface PathLogPoint extends LatLng {
  /** Optional client-reported instantaneous speed (km/h). */
  speedKmh?: number;
  /** ISO timestamp or epoch ms. */
  timestamp: string | number;
}

const toRad = (deg: number): number => (deg * Math.PI) / 180;

/**
 * Great-circle distance between two coordinates, in metres.
 */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Whether `point` is within `radiusM` metres of `target`.
 */
export function isWithinRadius(
  point: LatLng,
  target: LatLng,
  radiusM: number,
): boolean {
  return haversineMeters(point, target) <= radiusM;
}

/**
 * Total path length (metres) by summing Haversine distance between consecutive
 * points. Returns 0 for fewer than two points.
 */
export function pathDistanceMeters(points: LatLng[]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += haversineMeters(points[i - 1], points[i]);
  }
  return total;
}

const toEpochMs = (t: string | number): number =>
  typeof t === 'number' ? t : new Date(t).getTime();

/**
 * Derive aggregate stats from a recorded path log:
 * - total distance (km)
 * - moving time (seconds) — gaps longer than `maxGapSeconds` are treated as
 *   pauses and excluded so a paused session doesn't inflate elapsed time.
 * - average speed (km/h) over moving time.
 */
export function summarizePathLog(
  log: PathLogPoint[],
  maxGapSeconds = 120,
): { totalDistanceKm: number; movingSeconds: number; avgSpeedKmh: number } {
  if (log.length < 2) {
    return { totalDistanceKm: 0, movingSeconds: 0, avgSpeedKmh: 0 };
  }

  let distanceM = 0;
  let movingSeconds = 0;

  for (let i = 1; i < log.length; i += 1) {
    const prev = log[i - 1];
    const curr = log[i];
    const dtSec = (toEpochMs(curr.timestamp) - toEpochMs(prev.timestamp)) / 1000;
    if (dtSec <= 0) continue;

    distanceM += haversineMeters(prev, curr);
    if (dtSec <= maxGapSeconds) {
      movingSeconds += dtSec;
    }
  }

  const totalDistanceKm = distanceM / 1000;
  const avgSpeedKmh =
    movingSeconds > 0 ? totalDistanceKm / (movingSeconds / 3600) : 0;

  return {
    totalDistanceKm: Number(totalDistanceKm.toFixed(3)),
    movingSeconds: Math.round(movingSeconds),
    avgSpeedKmh: Number(avgSpeedKmh.toFixed(2)),
  };
}
