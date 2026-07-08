import { ACHIEVEMENTS, computeAchievements } from '../achievements';

describe('computeAchievements', () => {
  const zero = {
    routesCompleted: 0,
    distanceKm: 0,
    checkpointsScanned: 0,
    countries: 0,
  };

  it('returns the full catalog, all locked, for a brand-new user', () => {
    const result = computeAchievements(zero);
    expect(result).toHaveLength(ACHIEVEMENTS.length);
    expect(result.every((a) => !a.unlocked)).toBe(true);
    expect(result.every((a) => a.progress === 0)).toBe(true);
  });

  it('unlocks a badge exactly at its threshold', () => {
    const result = computeAchievements({ ...zero, routesCompleted: 1 });
    const first = result.find((a) => a.id === 'first_route');
    expect(first?.unlocked).toBe(true);
    expect(first?.progress).toBe(1);
  });

  it('reports partial progress on a locked badge', () => {
    const result = computeAchievements({ ...zero, distanceKm: 25 });
    const fifty = result.find((a) => a.id === 'distance_50');
    expect(fifty?.unlocked).toBe(false);
    expect(fifty?.progress).toBeCloseTo(0.5);
  });

  it('clamps progress at 1 when well past the threshold', () => {
    const result = computeAchievements({ ...zero, checkpointsScanned: 999 });
    const ten = result.find((a) => a.id === 'checkpoints_10');
    expect(ten?.unlocked).toBe(true);
    expect(ten?.progress).toBe(1);
  });

  it('unlocks badges across independent metrics', () => {
    const result = computeAchievements({
      routesCompleted: 5,
      distanceKm: 60,
      checkpointsScanned: 0,
      countries: 2,
    });
    const unlockedIds = result.filter((a) => a.unlocked).map((a) => a.id);
    expect(unlockedIds).toEqual(
      expect.arrayContaining([
        'first_route',
        'five_routes',
        'distance_10',
        'distance_50',
        'countries_2',
      ]),
    );
    expect(unlockedIds).not.toContain('checkpoints_10');
    expect(unlockedIds).not.toContain('twenty_routes');
  });
});
