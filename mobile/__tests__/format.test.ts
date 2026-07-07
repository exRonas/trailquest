import {
  formatDistanceKm,
  formatDuration,
  formatClock,
  estimateMinutesRemaining,
  labelForCategory,
} from '../src/utils/format';

describe('format utils', () => {
  it('formats distance with metre/km thresholds', () => {
    expect(formatDistanceKm(0.4)).toBe('400 m');
    expect(formatDistanceKm(3.25)).toBe('3.3 km');
    expect(formatDistanceKm(12.6)).toBe('13 km');
  });

  it('formats durations', () => {
    expect(formatDuration(45)).toBe('45m');
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(110)).toBe('1h 50m');
  });

  it('formats a clock from seconds', () => {
    expect(formatClock(750)).toBe('12:30');
    expect(formatClock(3909)).toBe('1:05:09');
  });

  it('titlecases enum labels', () => {
    expect(labelForCategory('GATHERING_SPOT')).toBe('Gathering Spot');
  });

  it('estimates remaining time from pace once underway', () => {
    // 25% done in 15 min -> projected total 60 min -> ~45 min remaining.
    const remaining = estimateMinutesRemaining(0.25, 120, 15 * 60);
    expect(Math.round(remaining)).toBe(45);
  });
});
