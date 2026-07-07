import { LEVEL_THRESHOLDS, MAX_LEVEL, levelForXp } from '../levels';

describe('levelForXp', () => {
  it('starts at level 0 with 0 xp', () => {
    const info = levelForXp(0);
    expect(info.level).toBe(0);
    expect(info.xpIntoLevel).toBe(0);
    expect(info.xpForNextLevel).toBe(LEVEL_THRESHOLDS[1]);
    expect(info.progress).toBe(0);
  });

  it('stays at level 0 for xp just below the level-1 threshold', () => {
    const info = levelForXp(LEVEL_THRESHOLDS[1] - 1);
    expect(info.level).toBe(0);
  });

  it('reaches a level exactly at its threshold', () => {
    const info = levelForXp(LEVEL_THRESHOLDS[2]);
    expect(info.level).toBe(2);
    expect(info.xpIntoLevel).toBe(0);
    expect(info.progress).toBe(0);
  });

  it('computes progress fraction within a level', () => {
    const base = LEVEL_THRESHOLDS[1];
    const span = LEVEL_THRESHOLDS[2] - base;
    const info = levelForXp(base + span / 2);
    expect(info.level).toBe(1);
    expect(info.progress).toBeCloseTo(0.5);
  });

  it('caps at MAX_LEVEL and reports null xpForNextLevel', () => {
    const info = levelForXp(LEVEL_THRESHOLDS[MAX_LEVEL] + 10_000);
    expect(info.level).toBe(MAX_LEVEL);
    expect(info.xpForNextLevel).toBeNull();
    expect(info.progress).toBe(1);
  });

  it('clamps negative or fractional xp to a safe non-negative integer', () => {
    expect(levelForXp(-50).xp).toBe(0);
    expect(levelForXp(-50).level).toBe(0);
    expect(levelForXp(299.9).xp).toBe(299);
    expect(levelForXp(299.9).level).toBe(0);
  });

  it('has strictly increasing thresholds (curve never gets easier)', () => {
    for (let i = 1; i < LEVEL_THRESHOLDS.length; i += 1) {
      expect(LEVEL_THRESHOLDS[i]).toBeGreaterThan(LEVEL_THRESHOLDS[i - 1]);
    }
  });

  it('has a non-decreasing per-level cost (each level is not easier than the last)', () => {
    const spans = LEVEL_THRESHOLDS.slice(1).map(
      (t, i) => t - LEVEL_THRESHOLDS[i],
    );
    for (let i = 1; i < spans.length; i += 1) {
      expect(spans[i]).toBeGreaterThanOrEqual(spans[i - 1]);
    }
  });
});
