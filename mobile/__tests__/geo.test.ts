import {
  haversineMeters,
  isWithinRadius,
  smoothedSpeedKmh,
  routeProgressFraction,
} from '../src/utils/geo';

describe('geo utils', () => {
  it('measures a known distance (~1.7km in Paris)', () => {
    const d = haversineMeters(
      { lat: 48.8584, lng: 2.2945 },
      { lat: 48.8738, lng: 2.295 },
    );
    expect(d).toBeGreaterThan(1600);
    expect(d).toBeLessThan(1800);
  });

  it('returns 0 for identical points', () => {
    expect(haversineMeters({ lat: 1, lng: 1 }, { lat: 1, lng: 1 })).toBe(0);
  });

  it('detects points within a trigger radius', () => {
    const a = { lat: 48.8584, lng: 2.2945 };
    const b = { lat: 48.85842, lng: 2.29452 };
    expect(isWithinRadius(a, b, 30)).toBe(true);
    expect(isWithinRadius({ lat: 48.8584, lng: 2.2945 }, { lat: 48.8738, lng: 2.295 }, 30)).toBe(false);
  });

  it('computes smoothed speed (~6 km/h over 100m in 60s)', () => {
    const t0 = Date.now();
    const speed = smoothedSpeedKmh([
      { lat: 48.8584, lng: 2.2945, t: t0 },
      { lat: 48.8593, lng: 2.2945, t: t0 + 60_000 },
    ]);
    expect(speed).toBeGreaterThan(4);
    expect(speed).toBeLessThan(8);
  });

  it('returns 0 progress for an empty/short path', () => {
    expect(routeProgressFraction({ lat: 0, lng: 0 }, [])).toBe(0);
  });

  it('approaches 1 as the user nears the path end', () => {
    const path = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 1 },
      { lat: 0, lng: 2 },
    ];
    const atEnd = routeProgressFraction({ lat: 0, lng: 2 }, path);
    expect(atEnd).toBeGreaterThan(0.9);
  });
});
