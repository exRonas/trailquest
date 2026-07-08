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

/** Derive the same 5-step shade ramp the static pine palette uses, from any base hue. */
export function shadeSet(base: string): BrandShades {
  return {
    primary: base,
    primaryDark: darken(base, 0.18),
    primaryEmphasis: darken(base, 0.42),
    primarySoft: lighten(base, 0.82),
    primaryTint: lighten(base, 0.92),
  };
}
