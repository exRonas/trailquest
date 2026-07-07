/**
 * One-off backfill: for any route that still has no `routeGeometry` (i.e. it
 * was seeded before road-snapping existed, or created without using the admin
 * panel's "Snap to roads"), call Mapbox Directions on its pathPoints and store
 * the resulting street-following geometry — same computation the admin panel
 * does client-side, just run once for existing data.
 *
 * Usage: npm run backfill:geometry
 */
import { Prisma } from '@prisma/client';
import { prisma } from '../src/lib/prisma';

const TOKEN = process.env.MAPBOX_PUBLIC_TOKEN ?? '';

interface GeoPoint {
  lat: number;
  lng: number;
}
interface PathPoint extends GeoPoint {
  sequence: number;
}

interface Snapped {
  geometry: GeoPoint[];
  distanceKm: number;
  durationMin: number;
}

function haversineKm(points: GeoPoint[]): number {
  const R = 6371;
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    total += 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  return Number(total.toFixed(2));
}

async function snapToRoads(waypoints: GeoPoint[]): Promise<Snapped> {
  const straight: Snapped = {
    geometry: waypoints,
    distanceKm: haversineKm(waypoints),
    durationMin: Math.round((haversineKm(waypoints) / 4.5) * 60),
  };
  if (!TOKEN || waypoints.length < 2) return straight;

  const coords = waypoints
    .slice(0, 25)
    .map((p) => `${p.lng},${p.lat}`)
    .join(';');
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/walking/${coords}` +
    `?geometries=geojson&overview=full&access_token=${TOKEN}`;

  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  Directions API ${res.status} — falling back to straight line`);
    return straight;
  }
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
}

async function main() {
  if (!TOKEN) {
    console.error('MAPBOX_PUBLIC_TOKEN is not set in backend/.env — aborting.');
    process.exit(1);
  }

  const routes = await prisma.route.findMany({
    // Seeded routes never had this column set at all (true SQL NULL), while
    // admin-saved routes that explicitly clear it store the JSON null literal
    // — match both so neither case is missed.
    where: {
      OR: [
        { routeGeometry: { equals: Prisma.DbNull } },
        { routeGeometry: { equals: Prisma.JsonNull } },
      ],
    },
    select: { id: true, title: true, pathPoints: true },
  });

  if (routes.length === 0) {
    console.log('Nothing to backfill — every route already has routeGeometry.');
    return;
  }

  console.log(`Backfilling ${routes.length} route(s)...`);
  for (const route of routes) {
    const waypoints = (route.pathPoints as unknown as PathPoint[])
      .slice()
      .sort((a, b) => a.sequence - b.sequence)
      .map((p) => ({ lat: p.lat, lng: p.lng }));

    const snapped = await snapToRoads(waypoints);
    await prisma.route.update({
      where: { id: route.id },
      data: {
        routeGeometry: snapped.geometry as unknown as Prisma.InputJsonValue,
        distanceKm: snapped.distanceKm,
        estimatedMinutes: snapped.durationMin,
      },
    });
    console.log(
      `  ✓ ${route.title} — ${snapped.geometry.length}-pt line, ${snapped.distanceKm}km / ${snapped.durationMin}min`,
    );
  }
  console.log('Done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
