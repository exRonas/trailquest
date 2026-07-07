/**
 * Preset cartoon avatars: a MaterialCommunityIcons animal on a colored disc.
 * An avatar id is "<icon>-<colorIndex>" (e.g. "panda-2"); the backend stores
 * the id opaquely, so adding icons/colors here never needs a migration.
 */

export const AVATAR_ICONS = [
  'panda',
  'owl',
  'penguin',
  'rabbit',
  'cat',
  'dog',
  'koala',
  'duck',
  'turtle',
  'bee',
  'butterfly',
  'unicorn',
] as const;

/** Disc background / icon color pairs — playful but on-palette. */
export const AVATAR_COLORS = [
  { bg: '#E7F2EC', fg: '#1F6F54' }, // pine
  { bg: '#FBEDE5', fg: '#C9572A' }, // clay
  { bg: '#E5EFF8', fg: '#2E6FAF' }, // blue
  { bg: '#EFE9F7', fg: '#6D4C9F' }, // purple
  { bg: '#E1F2EF', fg: '#2E8E7E' }, // teal
  { bg: '#FBF0DC', fg: '#B9791C' }, // amber
] as const;

export interface AvatarSpec {
  icon: string;
  bg: string;
  fg: string;
}

/** Parse a stored avatar id; returns null for unknown/legacy ids. */
export function parseAvatarId(id: string | null | undefined): AvatarSpec | null {
  if (!id) return null;
  const sep = id.lastIndexOf('-');
  if (sep <= 0) return null;
  const icon = id.slice(0, sep);
  const colorIndex = Number(id.slice(sep + 1));
  if (!(AVATAR_ICONS as readonly string[]).includes(icon)) return null;
  const color = AVATAR_COLORS[colorIndex];
  if (!color) return null;
  return { icon, bg: color.bg, fg: color.fg };
}

export function makeAvatarId(icon: string, colorIndex: number): string {
  return `${icon}-${colorIndex}`;
}
