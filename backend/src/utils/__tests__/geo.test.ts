import {
  haversineMeters,
  isWithinRadius,
  pathDistanceMeters,
  summarizePathLog,
} from '../geo';

describe('haversineMeters', () => {
  it('returns 0 for identical points', () => {
    expect(haversineMeters({ lat: 52.3, lng: 76.9 }, { lat: 52.3, lng: 76.9 })).toBe(0);
  });

  it('matches a known distance (Pavlodar to Astana, ~400km)', () => {
    const pavlodar = { lat: 52.2833, lng: 76.95 };
    const astana = { lat: 51.1694, lng: 71.4491 };
    const km = haversineMeters(pavlodar, astana) / 1000;
    expect(km).toBeGreaterThan(380);
    expect(km).toBeLessThan(420);
  });

  it('is symmetric', () => {
    const a = { lat: 10, lng: 20 };
    const b = { lat: 15, lng: 25 };
    expect(haversineMeters(a, b)).toBeCloseTo(haversineMeters(b, a));
  });
});

describe('isWithinRadius', () => {
  const target = { lat: 52.3, lng: 76.9 };

  it('is true when the point is inside the radius', () => {
    expect(isWithinRadius({ lat: 52.3001, lng: 76.9 }, target, 50)).toBe(true);
  });

  it('is false when the point is outside the radius', () => {
    expect(isWithinRadius({ lat: 53.3, lng: 76.9 }, target, 50)).toBe(false);
  });
});

describe('pathDistanceMeters', () => {
  it('is 0 for fewer than two points', () => {
    expect(pathDistanceMeters([])).toBe(0);
    expect(pathDistanceMeters([{ lat: 1, lng: 1 }])).toBe(0);
  });

  it('sums consecutive legs', () => {
    const points = [
      { lat: 52.3, lng: 76.9 },
      { lat: 52.31, lng: 76.9 },
      { lat: 52.32, lng: 76.9 },
    ];
    const total = pathDistanceMeters(points);
    const leg1 = haversineMeters(points[0], points[1]);
    const leg2 = haversineMeters(points[1], points[2]);
    expect(total).toBeCloseTo(leg1 + leg2);
  });
});

describe('summarizePathLog', () => {
  it('returns zeros for fewer than two points', () => {
    const result = summarizePathLog([{ lat: 1, lng: 1, timestamp: 0 }]);
    expect(result).toEqual({ totalDistanceKm: 0, movingSeconds: 0, avgSpeedKmh: 0 });
  });

  it('excludes gaps longer than maxGapSeconds from moving time', () => {
    const log = [
      { lat: 52.3, lng: 76.9, timestamp: 0 },
      { lat: 52.301, lng: 76.9, timestamp: 10_000 }, // 10s, counted
      // 5-minute gap (paused) — distance still counted, time is not
      { lat: 52.302, lng: 76.9, timestamp: 310_000 },
    ];
    const result = summarizePathLog(log, 120);
    // Only the first 10s leg counts toward moving time.
    expect(result.movingSeconds).toBe(10);
    expect(result.totalDistanceKm).toBeGreaterThan(0);
  });

  it('ignores non-positive or zero time deltas (out-of-order/duplicate samples)', () => {
    const log = [
      { lat: 52.3, lng: 76.9, timestamp: 10_000 },
      { lat: 52.301, lng: 76.9, timestamp: 5_000 }, // earlier than previous
    ];
    const result = summarizePathLog(log);
    expect(result.movingSeconds).toBe(0);
    expect(result.totalDistanceKm).toBe(0);
  });

  it('computes average speed from distance and moving time', () => {
    // ~1000m over 100s => 10 m/s => 36 km/h
    const log = [
      { lat: 0, lng: 0, timestamp: 0 },
      { lat: 0.009, lng: 0, timestamp: 100_000 },
    ];
    const result = summarizePathLog(log);
    expect(result.avgSpeedKmh).toBeGreaterThan(30);
    expect(result.avgSpeedKmh).toBeLessThan(42);
  });
});
