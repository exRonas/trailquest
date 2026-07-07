import { Difficulty, RouteCategory, CheckpointType, TipType } from '../types/api';
import { Language } from '../i18n/translations';

export function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

export function formatDistanceMeters(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

const DURATION_UNITS: Record<Language, { h: string; m: string }> = {
  en: { h: 'h', m: 'm' },
  ru: { h: 'ч', m: 'мин' },
  kk: { h: 'сағ', m: 'мин' },
};

/** Minutes -> "1h 50m" / "45m" (localized unit letters per language). */
export function formatDuration(totalMinutes: number, lang: Language = 'en'): string {
  const mins = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const u = DURATION_UNITS[lang];
  if (h === 0) return `${m}${u.m}`;
  if (m === 0) return `${h}${u.h}`;
  return `${h}${u.h} ${m}${u.m}`;
}

/** Seconds -> "1:05:09" / "12:30". */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

export function formatSpeed(kmh: number): string {
  return `${kmh.toFixed(1)} km/h`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.round((Date.now() - then) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return formatDate(iso);
}

const titleCase = (s: string): string =>
  s
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

export const labelForCategory = (c: RouteCategory): string => titleCase(c);
export const labelForDifficulty = (d: Difficulty): string => titleCase(d);
export const labelForCheckpointType = (t: CheckpointType): string =>
  titleCase(t);
export const labelForTipType = (t: TipType): string => titleCase(t);

/**
 * Compute a rough ETA (minutes remaining) from progress fraction and the route's
 * total estimated minutes, biased by the user's current pace if available.
 */
export function estimateMinutesRemaining(
  fraction: number,
  estimatedMinutes: number,
  elapsedSeconds: number,
): number {
  const elapsedMin = elapsedSeconds / 60;
  if (fraction > 0.05) {
    // Pace-based: extrapolate from how long the completed fraction took.
    const projectedTotal = elapsedMin / fraction;
    return Math.max(0, projectedTotal - elapsedMin);
  }
  // Early on, fall back to the route's static estimate.
  return Math.max(0, estimatedMinutes * (1 - fraction));
}
