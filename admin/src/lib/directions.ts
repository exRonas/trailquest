import { GeoPoint } from '../types';

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ?? '';

export interface SnappedRoute {
  geometry: GeoPoint[];
  distanceKm: number;
  durationMin: number;
}

/**
 * Snap a set of waypoints to walkable streets using the Mapbox Directions API
 * (walking profile). Returns the dense road-following geometry plus the
 * computed distance/duration. Falls back to a straight line through the
 * waypoints if the API can't route them (or no token).
 */
export async function snapToRoads(waypoints: GeoPoint[]): Promise<SnappedRoute> {
  const straight: SnappedRoute = {
    geometry: waypoints,
    distanceKm: haversineKm(waypoints),
    durationMin: Math.round((haversineKm(waypoints) / 4.5) * 60), // ~4.5 km/h walk
  };

  if (!TOKEN || waypoints.length < 2) return straight;

  // Directions allows up to 25 coordinates per walking request.
  const coords = waypoints
    .slice(0, 25)
    .map((p) => `${p.lng},${p.lat}`)
    .join(';');
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/walking/${coords}` +
    `?geometries=geojson&overview=full&access_token=${TOKEN}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return straight;
    const json = (await res.json()) as {
      routes?: {
        distance: number;
        duration: number;
        geometry: { coordinates: [number, number][] };
      }[];
    };
    const route = json.routes?.[0];
    if (!route) return straight;
    return {
      geometry: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
      distanceKm: Number((route.distance / 1000).toFixed(2)),
      durationMin: Math.max(1, Math.round(route.duration / 60)),
    };
  } catch {
    return straight;
  }
}

function haversineKm(points: GeoPoint[]): number {
  const R = 6371;
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    total += 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  return Number(total.toFixed(2));
}

const toRad = (d: number): number => (d * Math.PI) / 180;
