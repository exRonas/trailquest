import { describe, it, expect, vi, beforeEach } from 'vitest';
import { snapToRoads } from '../lib/directions';

// Force the network path to fail so snapToRoads always uses its straight-line
// fallback — a pure, deterministic path that exercises the haversine distance
// + walk-time estimate regardless of whether a Mapbox token is configured.
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('no network')));
});

describe('snapToRoads (straight-line fallback)', () => {
  it('returns the waypoints unchanged as the geometry', async () => {
    const waypoints = [
      { lat: 52.28, lng: 76.95 },
      { lat: 52.29, lng: 76.96 },
    ];
    const result = await snapToRoads(waypoints);
    expect(result.geometry).toEqual(waypoints);
  });

  it('computes a plausible distance and walking time', async () => {
    const waypoints = [
      { lat: 52.0, lng: 76.0 },
      { lat: 52.01, lng: 76.0 }, // ~1.11 km north
    ];
    const result = await snapToRoads(waypoints);
    expect(result.distanceKm).toBeGreaterThan(1);
    expect(result.distanceKm).toBeLessThan(1.3);
    // ~1.11 km at 4.5 km/h ≈ 15 min.
    expect(result.durationMin).toBeGreaterThan(10);
    expect(result.durationMin).toBeLessThan(20);
  });

  it('handles a single waypoint (zero distance)', async () => {
    const result = await snapToRoads([{ lat: 52, lng: 76 }]);
    expect(result.distanceKm).toBe(0);
  });
});
