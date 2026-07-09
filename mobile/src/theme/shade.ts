/** Small hex-color mixing helpers used to derive a full brand shade set
 *  (dark/emphasis/soft/tint) from a single base color, e.g. the user's
 *  chosen avatar accent. */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(n: number): string {
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
}

function mix(hex: string, target: [number, number, number], amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const [tr, tg, tb] = target;
  return `#${toHex(r + (tr - r) * amount)}${toHex(g + (tg - g) * amount)}${toHex(b + (tb - b) * amount)}`;
}

export function lighten(hex: string, amount: number): string {
  return mix(hex, [255, 255, 255], amount);
}

export function darken(hex: string, amount: number): string {
  return mix(hex, [0, 0, 0], amount);
}

/** Nudge `base` toward `target` by `amount` (0..1) — keeps base's hue
 *  dominant at small amounts while giving it some of target's cast. */
export function blend(base: string, target: string, amount: number): string {
  return mix(base, hexToRgb(target), amount);
}

export interface BrandShades {
  primary: string;
  primaryDark: string;
  primaryEmphasis: string;
  primarySoft: string;
  primaryTint: string;
}

/** Dark-theme surface the soft/tint shades blend toward instead of white, so a
 *  brand accent's soft background stays dark rather than washing out. */
const DARK_SURFACE: [number, number, number] = [21, 28, 24];

/** A "soft" pill background for `base`, theme-aware: blends toward white in
 *  light mode, toward the dark surface in dark mode. Use this instead of
 *  `lighten(base, amount)` for any badge/pill background that must also work
 *  in dark mode — `lighten` alone always washes out to a light color. */
export function softTint(base: string, dark: boolean, amount = 0.82): string {
  return dark ? mix(base, DARK_SURFACE, amount) : lighten(base, amount);
}

/** Derive the same 5-step shade ramp the static pine palette uses, from any
 *  base hue. In dark mode the soft/tint steps blend toward the dark surface
 *  instead of white so pills/backgrounds read correctly. */
export function shadeSet(base: string, dark = false): BrandShades {
  return {
    primary: base,
    primaryDark: darken(base, 0.18),
    primaryEmphasis: dark ? lighten(base, 0.3) : darken(base, 0.42),
    primarySoft: dark ? mix(base, DARK_SURFACE, 0.72) : lighten(base, 0.82),
    primaryTint: dark ? mix(base, DARK_SURFACE, 0.85) : lighten(base, 0.92),
  };
}
